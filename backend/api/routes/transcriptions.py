import logging
import math
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Request, Response, Depends
from sqlmodel import col, func, select

from backend.api.dependencies import SQLSessionDep, UserDep
from backend.utils.get_file_s3_key import get_file_s3_key
from common.database.postgres_models import Case, Minute, MinuteVersion, Recording, Transcription, TranscriptionFeedback
from common.security.encryption import decrypt_date, encrypt_date
from common.metrics import offline_sync_total
from common.services.queue_services import get_queue_service
from common.services.storage_services import get_storage_service
from common.settings import get_settings
from common.telemetry.events import TelemetryContext, build_context, record_module_access, record_offline_stage
from common.types import (
    DialogueEntry,
    PaginatedTranscriptionsResponse,
    RecordingCreateRequest,
    RecordingCreateResponse,
    SingleRecording,
    SingleRecordingSegment,
    TaskType,
    TranscriptionCreateRequest,
    TranscriptionCreateResponse,
    TranscriptionGetResponse,
    TranscriptionMetadata,
    TranscriptionPatchRequest,
    TranscriptionDialogueUpdate,
    TranscriptionFeedbackRequest,
    TranscriptionJobMessageData,
    EvidenceClickRequest,
    WorkerMessage,
)

settings = get_settings()

storage_service = get_storage_service(settings.STORAGE_SERVICE_NAME)


transcriptions_router = APIRouter(tags=["Transcriptions"])
transcription_queue_service = get_queue_service(
    settings.QUEUE_SERVICE_NAME, settings.TRANSCRIPTION_QUEUE_NAME, settings.TRANSCRIPTION_DEADLETTER_QUEUE_NAME
)

logger = logging.getLogger(__name__)


def _context_from_user(user: UserDep) -> TelemetryContext:
    tenant_label = str(getattr(settings, "TENANT_CONFIG_ID", None) or user.organisation_id)
    service_domain_label = str(user.service_domain_id) if user.service_domain_id else None
    role_label = getattr(user.role, "name", None)
    return build_context(tenant=tenant_label, service_domain=service_domain_label, role=role_label)


@transcriptions_router.get("/transcriptions", response_model=PaginatedTranscriptionsResponse)
async def list_transcriptions(
    session: SQLSessionDep,
    current_user: UserDep,
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
) -> PaginatedTranscriptionsResponse:
    """Get paginated metadata for transcriptions for the current user."""
    context = _context_from_user(current_user)
    record_module_access(context, "transcription", True)
    count_statement = select(func.count(col(Transcription.id))).where(
        Transcription.user_id == current_user.id,
        Transcription.organisation_id == current_user.organisation_id,
    )
    if current_user.service_domain_id:
        count_statement = count_statement.where(Transcription.service_domain_id == current_user.service_domain_id)
    count_result = await session.exec(count_statement)
    total_count = count_result.one()

    offset = (page - 1) * page_size
    statement = select(Transcription).where(
        Transcription.user_id == current_user.id,
        Transcription.organisation_id == current_user.organisation_id,
    )
    if current_user.service_domain_id:
        statement = statement.where(Transcription.service_domain_id == current_user.service_domain_id)
    statement = statement.order_by(col(Transcription.created_datetime).desc()).offset(offset).limit(page_size)
    result = await session.exec(statement)
    transcriptions = result.all()

    items = [
        TranscriptionMetadata(
            id=t.id,
            created_datetime=t.created_datetime,
            title=t.title,
            text=t.dialogue_entries[0]["text"][:100] if t.dialogue_entries else "",
            status=t.status,
            case_reference=t.case_reference,
            processing_mode=t.processing_mode,
        )
        for t in transcriptions
    ]

    total_pages = math.ceil(total_count / page_size)

    return PaginatedTranscriptionsResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@transcriptions_router.post("/recordings")
async def create_recording(
    request: RecordingCreateRequest, session: SQLSessionDep, user: UserDep
) -> RecordingCreateResponse:
    context = _context_from_user(user)
    record_module_access(context, "transcription", True)
    recording_id = uuid.uuid4()
    file_name = f"{recording_id}.{request.file_extension}"
    user_upload_s3_file_key = get_file_s3_key(user.email, file_name)
    recording = Recording(
        user_id=user.id,
        s3_file_key=user_upload_s3_file_key,
        organisation_id=user.organisation_id,
        service_domain_id=user.service_domain_id,
        captured_offline=request.captured_offline or False,
    )
    session.add(recording)
    await session.commit()
    if recording.captured_offline:
        offline_sync_total.labels(stage="recording_queued").inc()
        record_offline_stage(context, "recording_queued")
    presigned_url = await storage_service.generate_presigned_url_put_object(user_upload_s3_file_key, 3600)
    await session.refresh(recording)
    return RecordingCreateResponse(id=recording.id, upload_url=presigned_url)


@transcriptions_router.post("/transcriptions", response_model=TranscriptionCreateResponse, status_code=201)
async def create_transcription(
    request: TranscriptionCreateRequest,
    session: SQLSessionDep,
    current_user: UserDep,
    raw_request: Request,
) -> TranscriptionCreateResponse:
    """Start a transcription job."""
    context = _context_from_user(current_user)
    record_module_access(context, "transcription", True)
    recording = await session.get(Recording, request.recording_id)
    if (
        not recording
        or recording.user_id != current_user.id
        or recording.organisation_id != current_user.organisation_id
        or (current_user.service_domain_id and recording.service_domain_id != current_user.service_domain_id)
    ):
        raise HTTPException(404, detail="Recording not found")
    if not request.case_reference:
        raise HTTPException(status_code=400, detail="case_reference is required")

    existing_case = await session.exec(
        select(Case).where(
            Case.case_reference == request.case_reference,
            Case.organisation_id == current_user.organisation_id,
            Case.service_domain_id == current_user.service_domain_id,
        )
    )
    case = existing_case.first()
    if not case:
        case = Case(
            case_reference=request.case_reference,
            organisation_id=current_user.organisation_id,
            service_domain_id=current_user.service_domain_id,
            worker_team=request.worker_team,
            subject_initials=request.subject_initials,
            subject_dob_ciphertext=encrypt_date(request.subject_dob),
        )
        session.add(case)
        await session.flush()

    transcription = Transcription(
        user_id=current_user.id,
        title=request.title,
        organisation_id=current_user.organisation_id,
        service_domain_id=current_user.service_domain_id,
        case_id=case.id,
        case_reference=case.case_reference,
        worker_team=request.worker_team,
        subject_initials=request.subject_initials,
        subject_dob_ciphertext=encrypt_date(request.subject_dob),
        processing_mode=request.processing_mode or "fast",
    )

    if not await storage_service.check_object_exists(recording.s3_file_key):
        raise HTTPException(
            status_code=404,
            detail=f"Recording file not found in S3: {recording.s3_file_key}",
        )

    minute = Minute(
        template_name=request.template_name,
        user_template_id=request.template_id,
        agenda=request.agenda,
        transcription_id=transcription.id,
        organisation_id=current_user.organisation_id,
        service_domain_id=current_user.service_domain_id,
        created_by_user_id=current_user.id,
        case_id=case.id,
        case_reference=case.case_reference,
        worker_team=request.worker_team,
        subject_initials=request.subject_initials,
        subject_dob_ciphertext=encrypt_date(request.subject_dob),
        visit_type=request.visit_type,
        intended_outcomes=request.intended_outcomes,
        risk_flags=request.risk_flags,
    )
    minute_version = MinuteVersion(minute_id=minute.id)
    session.add(transcription)
    session.add(minute)
    session.add(minute_version)
    recording.transcription_id = transcription.id
    await session.commit()

    preferred_service = (
        "azure_stt_batch"
        if (request.processing_mode or "fast") == "economy"
        else (settings.TRANSCRIPTION_SERVICES[0] if settings.TRANSCRIPTION_SERVICES else "")
    )
    from common.tracing import get_trace_id

    transcription_queue_service.publish_message(
        WorkerMessage(
            id=minute.id,
            type=TaskType.TRANSCRIPTION,
            data=TranscriptionJobMessageData(
                transcription_service=preferred_service,
                job_name=request.processing_mode or "fast",
                processing_mode=request.processing_mode or "fast",
            ),
            trace_id=get_trace_id(),
        )
    )

    return TranscriptionCreateResponse(id=transcription.id)


@transcriptions_router.get("/transcriptions/{transcription_id}", response_model=TranscriptionGetResponse)
async def get_transcription(
    transcription_id: uuid.UUID,
    session: SQLSessionDep,
    current_user: UserDep,
) -> TranscriptionGetResponse:
    """Get a specific transcription by ID."""
    record_module_access(_context_from_user(current_user), "transcription", True)
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != current_user.id
        or transcription.organisation_id != current_user.organisation_id
        or (current_user.service_domain_id and transcription.service_domain_id != current_user.service_domain_id)
    ):
        raise HTTPException(status_code=404, detail="Transcription not found")
    return TranscriptionGetResponse(
        id=transcription.id,
        status=transcription.status,
        dialogue_entries=transcription.dialogue_entries,
        title=transcription.title,
        created_datetime=transcription.created_datetime,
        case_reference=transcription.case_reference,
        worker_team=transcription.worker_team,
        subject_initials=transcription.subject_initials,
        subject_dob=decrypt_date(transcription.subject_dob_ciphertext),
        processing_mode=transcription.processing_mode,
    )


@transcriptions_router.get("/transcriptions/{transcription_id}/recordings")
async def get_recordings_for_transcription(
    transcription_id: uuid.UUID, session: SQLSessionDep, user: UserDep
) -> list[SingleRecording]:
    record_module_access(_context_from_user(user), "transcription", True)
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != user.id
        or transcription.organisation_id != user.organisation_id
        or (user.service_domain_id and transcription.service_domain_id != user.service_domain_id)
    ):
        raise HTTPException(404)

    result = await session.exec(
        select(Recording)
        .where(Recording.transcription_id == transcription.id)
        .order_by(col(Recording.created_datetime).desc())
    )
    recordings = result.all()
    # Only return oldest of each file type
    # So users only see original mp3 file if it was converted due to multiple channels
    recordings = {Path(recording.s3_file_key).suffix: recording for recording in recordings}.values()
    signed_recordings: list[SingleRecording] = []
    for recording in recordings:
        if not await storage_service.check_object_exists(recording.s3_file_key):
            continue
        key_path = Path(recording.s3_file_key)
        filename = f"{transcription.title}{key_path.suffix}" if transcription.title else key_path.name
        presigned_url = await storage_service.generate_presigned_url_get_object(
            recording.s3_file_key, filename, 60 * 60 * 12
        )
        signed_recordings.append(SingleRecording(id=recording.id, url=presigned_url, extension=key_path.suffix))

    return signed_recordings


@transcriptions_router.get("/recordings/{recording_id}/signed-url", response_model=SingleRecording)
async def get_signed_recording(
    recording_id: uuid.UUID, session: SQLSessionDep, user: UserDep
) -> SingleRecording:
    record_module_access(_context_from_user(user), "transcription", True)
    recording = await session.get(Recording, recording_id)
    if (
        not recording
        or recording.user_id != user.id
        or recording.organisation_id != user.organisation_id
        or (user.service_domain_id and recording.service_domain_id != user.service_domain_id)
    ):
        raise HTTPException(404)
    if not await storage_service.check_object_exists(recording.s3_file_key):
        raise HTTPException(404, "Recording not found")
    filename = Path(recording.s3_file_key).name
    url = await storage_service.generate_presigned_url_get_object(recording.s3_file_key, filename, 60 * 60)
    return SingleRecording(id=recording.id, url=url, extension=Path(recording.s3_file_key).suffix)


@transcriptions_router.get(
    "/transcriptions/{transcription_id}/recordings/{recording_id}/signed-url-range",
    response_model=SingleRecordingSegment,
)
async def get_signed_recording_range(
    transcription_id: uuid.UUID,
    recording_id: uuid.UUID,
    session: SQLSessionDep,
    user: UserDep,
    start_seconds: float = 0,
    end_seconds: float | None = None,
) -> SingleRecordingSegment:
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != user.id
        or transcription.organisation_id != user.organisation_id
        or (user.service_domain_id and transcription.service_domain_id != user.service_domain_id)
    ):
        raise HTTPException(404)

    recording = await session.get(Recording, recording_id)
    if not recording or recording.transcription_id != transcription.id:
        raise HTTPException(404)
    if not await storage_service.check_object_exists(recording.s3_file_key):
        raise HTTPException(404, "Recording not found")

    filename = Path(recording.s3_file_key).name
    base_url = await storage_service.generate_presigned_url_get_object(
        recording.s3_file_key, filename, 60 * 60
    )
    fragment = None
    if start_seconds or end_seconds is not None:
        if end_seconds is not None:
            fragment = f"#t={max(0, start_seconds):.2f},{max(0, end_seconds):.2f}"
        else:
            fragment = f"#t={max(0, start_seconds):.2f}"
    ranged_url = f"{base_url}{fragment}" if fragment else base_url
    return SingleRecordingSegment(
        id=recording.id,
        url=ranged_url,
        extension=Path(recording.s3_file_key).suffix,
        start_seconds=start_seconds,
        end_seconds=end_seconds,
    )


@transcriptions_router.post(
    "/transcriptions/{transcription_id}/evidence-click",
    status_code=204,
)
async def record_evidence_click(
    transcription_id: uuid.UUID,
    payload: EvidenceClickRequest,
    session: SQLSessionDep,
    user: UserDep,
):
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != user.id
        or transcription.organisation_id != user.organisation_id
        or (user.service_domain_id and transcription.service_domain_id != user.service_domain_id)
    ):
        raise HTTPException(404)
    recording = await session.get(Recording, payload.recording_id)
    if not recording or recording.transcription_id != transcription.id:
        raise HTTPException(404)
    # Audit middleware handles logging; avoid storing payload to reduce PII exposure
    return Response(status_code=204)


@transcriptions_router.patch("/transcriptions/{transcription_id}", response_model=Transcription)
async def save_transcription(
    transcription_id: uuid.UUID,
    transcription_data: TranscriptionPatchRequest,
    session: SQLSessionDep,
    current_user: UserDep,
):
    """Save or update a transcription."""
    logger.info("saving transcription for user %s", current_user.id)
    # Use the transcription service to handle the save operation
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != current_user.id
        or transcription.organisation_id != current_user.organisation_id
        or (current_user.service_domain_id and transcription.service_domain_id != current_user.service_domain_id)
    ):
        raise HTTPException(status_code=404, detail="Transcription not found")

    if transcription_data.title is not None:
        transcription.title = transcription_data.title
    if transcription_data.dialogue_entries is not None:
        transcription.dialogue_entries = transcription_data.dialogue_entries
    await session.commit()
    await session.refresh(transcription)

    return transcription


@transcriptions_router.get("/transcriptions/{transcription_id}/dialogue", response_model=list[DialogueEntry])
async def get_dialogue(
    transcription_id: uuid.UUID,
    session: SQLSessionDep,
    current_user: UserDep,
) -> list[DialogueEntry]:
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != current_user.id
        or transcription.organisation_id != current_user.organisation_id
        or (current_user.service_domain_id and transcription.service_domain_id != current_user.service_domain_id)
    ):
        raise HTTPException(status_code=404, detail="Transcription not found")
    return transcription.dialogue_entries or []


@transcriptions_router.patch("/transcriptions/{transcription_id}/dialogue", response_model=list[DialogueEntry])
async def update_dialogue(
    transcription_id: uuid.UUID,
    body: TranscriptionDialogueUpdate,
    session: SQLSessionDep,
    current_user: UserDep,
) -> list[DialogueEntry]:
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != current_user.id
        or transcription.organisation_id != current_user.organisation_id
        or (current_user.service_domain_id and transcription.service_domain_id != current_user.service_domain_id)
    ):
        raise HTTPException(status_code=404, detail="Transcription not found")
    transcription.dialogue_entries = body.dialogue_entries
    await session.commit()
    await session.refresh(transcription)
    return transcription.dialogue_entries or []


@transcriptions_router.post("/transcriptions/{transcription_id}/feedback", status_code=204)
async def submit_feedback(
    transcription_id: uuid.UUID,
    body: TranscriptionFeedbackRequest,
    session: SQLSessionDep,
    current_user: UserDep,
):
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != current_user.id
        or transcription.organisation_id != current_user.organisation_id
        or (current_user.service_domain_id and transcription.service_domain_id != current_user.service_domain_id)
    ):
        raise HTTPException(status_code=404, detail="Transcription not found")
    feedback = TranscriptionFeedback(
        transcription_id=transcription_id,
        organisation_id=current_user.organisation_id,
        service_domain_id=current_user.service_domain_id,
        payload=body.payload,
        wer=body.wer,
        der=body.der,
    )
    session.add(feedback)
    await session.commit()
    return None


@transcriptions_router.delete("/transcriptions/{transcription_id}", status_code=204)
async def delete_transcription(transcription_id: uuid.UUID, session: SQLSessionDep, current_user: UserDep):
    """Delete a specific transcription by ID."""
    # First check if the transcription exists and belongs to the user
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != current_user.id
        or transcription.organisation_id != current_user.organisation_id
        or (current_user.service_domain_id and transcription.service_domain_id != current_user.service_domain_id)
    ):
        raise HTTPException(status_code=404, detail="Transcription not found")

    # Delete the transcription
    await session.delete(transcription)
    await session.commit()
