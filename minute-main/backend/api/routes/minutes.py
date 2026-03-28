import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload

from common.errors import (
    APIException,
    ErrorCodes,
    not_found,
    forbidden,
    conflict,
    service_unavailable,
)
from sqlmodel import col, select
from sqlalchemy import func

from backend.api.dependencies import SQLSessionDep, UserDep
from common.database.postgres_models import (
    ExportStatus,
    JobStatus,
    Minute,
    MinuteTask,
    MinuteVersion,
    TaskSource,
    Transcription,
)
from common.services.export_handler_service import ExportHandlerService
from common.services.task_extraction_service import TaskExtractionService
from common.services.storage_services import get_storage_service
from common.services.queue_services import get_queue_service
from common.services.transcription_services.transcription_manager import TranscriptionServiceManager
from common.settings import get_settings
from common.config.access import is_module_enabled
from common.telemetry.events import build_context, record_module_access, TelemetryContext
from common.types import (
    EditMessageData,
    ExportResponse,
    EvidenceFragment,
    MinuteListItem,
    MinutesCreateRequest,
    MinuteVersionCreateRequest,
    MinuteVersionResponse,
    MinuteTaskCreateRequest,
    MinuteTaskPatchRequest,
    MinuteTaskResponse,
    MinuteTaskPushResponse,
    SourceCheckRequest,
    SourceCheckResponse,
    TaskType,
    WorkerMessage,
)

settings = get_settings()

llm_queue_service = get_queue_service(
    settings.QUEUE_SERVICE_NAME, settings.LLM_QUEUE_NAME, settings.LLM_DEADLETTER_QUEUE_NAME
)

minutes_router = APIRouter(tags=["Minutes"])


def ensure_minutes_module_enabled(user: UserDep) -> TelemetryContext:
    tenant_id = getattr(settings, "TENANT_CONFIG_ID", None) or str(user.organisation_id)
    context = build_context(
        tenant=str(tenant_id),
        service_domain=str(user.service_domain_id) if user.service_domain_id else None,
        role=getattr(user.role, "name", None),
    )
    allowed = is_module_enabled("minutes", getattr(settings, "TENANT_CONFIG_ID", None), telemetry_context=context)
    record_module_access(context, "minutes", allowed)
    if not allowed:
        raise forbidden("Minutes module is disabled for this tenant", ErrorCodes.MODULE_DISABLED)
    return context


@minutes_router.get("/transcription/{transcription_id}/minutes")
async def list_minutes_for_transcription(
    transcription_id: uuid.UUID,
    session: SQLSessionDep,
    user: UserDep,
    tags: list[str] | None = Query(default=None, description="Optional tag filter (matches any)"),
) -> list[MinuteListItem]:
    ensure_minutes_module_enabled(user)
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != user.id
        or transcription.organisation_id != user.organisation_id
        or (user.service_domain_id and transcription.service_domain_id != user.service_domain_id)
    ):
        raise not_found("Transcription", ErrorCodes.TRANSCRIPTION_NOT_FOUND)

    query = select(Minute).where(
        Minute.transcription_id == transcription_id,
        Minute.organisation_id == user.organisation_id,
    )
    if user.service_domain_id:
        query = query.where(Minute.service_domain_id == user.service_domain_id)
    if tags:
        query = query.where(
            Minute.tags.is_not(None),
            func.jsonb_exists_any(Minute.tags, tags),
        )
    query = query.order_by(col(Minute.updated_datetime).desc())
    result = await session.exec(query)
    minutes = result.all()
    return [
        MinuteListItem(
            id=minute.id,
            created_datetime=minute.created_datetime,
            updated_datetime=minute.updated_datetime,
            transcription_id=minute.transcription_id,
            template_name=minute.template_name,
            agenda=minute.agenda,
            case_reference=minute.case_reference,
            visit_type=minute.visit_type,
            intended_outcomes=minute.intended_outcomes,
            risk_flags=minute.risk_flags,
            tags=minute.tags,
        )
        for minute in minutes
    ]


@minutes_router.post("/transcription/{transcription_id}/minutes")
async def create_minute(
    transcription_id: uuid.UUID, request: MinutesCreateRequest, session: SQLSessionDep, user: UserDep, request_obj: Request
):
    ensure_minutes_module_enabled(user)
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != user.id
        or transcription.organisation_id != user.organisation_id
        or (user.service_domain_id and transcription.service_domain_id != user.service_domain_id)
    ):
        raise not_found("Transcription", ErrorCodes.TRANSCRIPTION_NOT_FOUND)
    minute = Minute(
        transcription_id=transcription_id,
        template_name=request.template_name,
        agenda=request.agenda,
        user_template_id=request.template_id,
        organisation_id=user.organisation_id,
        service_domain_id=user.service_domain_id,
        created_by_user_id=user.id,
        case_id=transcription.case_id,
        case_reference=transcription.case_reference,
        worker_team=transcription.worker_team,
        subject_initials=transcription.subject_initials,
        subject_dob_ciphertext=transcription.subject_dob_ciphertext,
        visit_type=request.visit_type,
        intended_outcomes=request.intended_outcomes,
        risk_flags=request.risk_flags,
        tags=request.tags or [],
    )
    session.add(minute)
    minute_version = MinuteVersion(id=uuid.uuid4(), minute_id=minute.id)
    session.add(minute_version)
    await session.commit()
    await session.refresh(minute_version)
    from common.tracing import get_trace_id

    llm_queue_service.publish_message(
        WorkerMessage(id=minute_version.id, type=TaskType.MINUTE, trace_id=get_trace_id())
    )


@minutes_router.post("/minutes/{minute_id}/source-check", response_model=SourceCheckResponse)
async def source_check(
    minute_id: uuid.UUID,
    request: SourceCheckRequest,
    session: SQLSessionDep,
    user: UserDep,
):
    ensure_minutes_module_enabled(user)
    result = await session.exec(
        select(Minute)
        .where(Minute.id == minute_id)
        .options(selectinload(Minute.transcription))
    )
    minute = result.first()
    if (
        not minute
        or not minute.transcription
        or minute.organisation_id != user.organisation_id
        or (user.service_domain_id and minute.service_domain_id != user.service_domain_id)
        or minute.transcription.user_id != user.id
    ):
        raise not_found("Minute", ErrorCodes.MINUTE_NOT_FOUND)

    transcription = minute.transcription
    entries = transcription.dialogue_entries or []
    text = request.text.lower()
    words = set(text.split())

    evidence: list[EvidenceFragment] = []
    for entry in entries:
        excerpt = entry.get("text") or ""
        if not excerpt:
            continue
        overlap = words.intersection(set(excerpt.lower().split()))
        support = "unsupported"
        if overlap:
            ratio = len(overlap) / max(1, len(words))
            if ratio >= 0.25:
                support = "supported"
            elif ratio >= 0.10:
                support = "partial"
        evidence.append(
            EvidenceFragment(
                excerpt=excerpt[:240],
                start_time=entry.get("start_time"),
                end_time=entry.get("end_time"),
                support=support,
            )
        )
    # Choose overall status: supported if any supported, partial if any partial, else unsupported
    status = "unsupported"
    if any(e.support == "supported" for e in evidence):
        status = "supported"
    elif any(e.support == "partial" for e in evidence):
        status = "partial"

    # Keep top 3 evidence items prioritizing supported > partial > unsupported
    evidence_sorted = sorted(
        evidence,
        key=lambda e: {"supported": 0, "partial": 1, "unsupported": 2}[e.support],
    )[:3]

    return SourceCheckResponse(status=status, evidence=evidence_sorted)


@minutes_router.get("/minutes/{minutes_id}")
async def get_minute(minutes_id: uuid.UUID, session: SQLSessionDep, user: UserDep) -> Minute:
    ensure_minutes_module_enabled(user)
    query = (
        select(Minute)
        .where(Minute.id == minutes_id)
        .options(
            selectinload(Minute.transcription),
            selectinload(Minute.minute_versions),
            selectinload(Minute.tasks),
        )
    )
    result = await session.exec(query)
    minute = result.first()
    if (
        not minute
        or not minute.transcription.user_id
        or minute.transcription.user_id != user.id
        or minute.organisation_id != user.organisation_id
        or (user.service_domain_id and minute.service_domain_id != user.service_domain_id)
    ):
        raise not_found("Minute", ErrorCodes.MINUTE_NOT_FOUND)

    return minute


@minutes_router.get("/minutes/{minute_id}/versions")
async def list_minute_versions(
    minute_id: uuid.UUID, session: SQLSessionDep, user: UserDep
) -> list[MinuteVersionResponse]:
    ensure_minutes_module_enabled(user)
    result = await session.exec(
        select(Minute)
        .where(Minute.id == minute_id)
        .options(selectinload(Minute.minute_versions), selectinload(Minute.transcription))
    )
    minute = result.first()
    if (
        not minute
        or not minute.transcription.user_id
        or minute.transcription.user_id != user.id
        or minute.organisation_id != user.organisation_id
        or (user.service_domain_id and minute.service_domain_id != user.service_domain_id)
    ):
        raise not_found("Minute", ErrorCodes.MINUTE_NOT_FOUND)

    return [
        MinuteVersionResponse(
            id=version.id,
            minute_id=minute_id,
            status=version.status,
            created_datetime=version.created_datetime,
            error=version.error,
            ai_edit_instructions=version.ai_edit_instructions,
            html_content=version.html_content,
            content_source=version.content_source,
        )
        for version in minute.minute_versions
    ]


@minutes_router.post("/minutes/{minute_id}/versions")
async def create_minute_version(
    minute_id: uuid.UUID, request: MinuteVersionCreateRequest, session: SQLSessionDep, user: UserDep, request_obj: Request
) -> MinuteVersionResponse:
    ensure_minutes_module_enabled(user)
    minute = await get_minute(minute_id, session, user)
    minute_version = MinuteVersion(
        id=uuid.uuid4(),
        minute_id=minute.id,
        content_source=request.content_source,
        html_content=request.html_content,
        ai_edit_instructions=request.ai_edit_instructions.instruction if request.ai_edit_instructions else None,
        status=JobStatus.AWAITING_START if request.ai_edit_instructions else JobStatus.COMPLETED,
    )
    minute.updated_datetime = datetime.now(tz=UTC)
    session.add(minute_version)
    await session.commit()
    await session.refresh(minute_version)
    if request.ai_edit_instructions:
        from common.tracing import get_trace_id

        llm_queue_service.publish_message(
            WorkerMessage(
                id=minute_version.id,
                data=EditMessageData(source_id=request.ai_edit_instructions.source_id),
                type=TaskType.EDIT,
                trace_id=get_trace_id(),
            )
        )
    else:
        # Manual edits export asynchronously via worker
        from common.tracing import get_trace_id

        llm_queue_service.publish_message(
            WorkerMessage(id=minute_version.id, type=TaskType.EXPORT, trace_id=get_trace_id())
        )
    return MinuteVersionResponse(
        id=minute_version.id,
        minute_id=minute_id,
        status=minute_version.status,
        created_datetime=minute_version.created_datetime,
        error=minute_version.error,
        ai_edit_instructions=minute_version.ai_edit_instructions,
        html_content=minute_version.html_content,
        content_source=minute_version.content_source,
    )


@minutes_router.get("/minute_versions/{minute_version_id}")
async def get_minute_version(minute_version_id: uuid.UUID, session: SQLSessionDep, user: UserDep) -> MinuteVersion:
    query = (
        select(MinuteVersion)
        .where(MinuteVersion.id == minute_version_id)
        .options(selectinload(MinuteVersion.minute).selectinload(Minute.transcription))
    )
    minute_version = (await session.exec(query)).first()
    if (
        not minute_version
        or not minute_version.minute.transcription.user_id
        or minute_version.minute.transcription.user_id != user.id
        or minute_version.minute.organisation_id != user.organisation_id
        or (
            user.service_domain_id and minute_version.minute.service_domain_id != user.service_domain_id
        )
    ):
        raise not_found("MinuteVersion", ErrorCodes.MINUTE_VERSION_NOT_FOUND)

    return minute_version


@minutes_router.get("/minutes/{minute_id}/tasks", response_model=list[MinuteTaskResponse])
async def list_minute_tasks(minute_id: uuid.UUID, session: SQLSessionDep, user: UserDep) -> list[MinuteTaskResponse]:
    minute = await get_minute(minute_id, session, user)
    return [MinuteTaskResponse.model_validate(task) for task in minute.tasks]


@minutes_router.post("/minutes/{minute_id}/tasks", response_model=MinuteTaskResponse, status_code=201)
async def create_minute_task(
    minute_id: uuid.UUID, request: MinuteTaskCreateRequest, session: SQLSessionDep, user: UserDep
) -> MinuteTaskResponse:
    minute = await get_minute(minute_id, session, user)
    minute_task = MinuteTask(
        minute_id=minute.id,
        organisation_id=minute.organisation_id,
        service_domain_id=minute.service_domain_id,
        case_id=minute.case_id,
        description=request.description,
        owner=request.owner,
        owner_role=request.owner_role,
        due_date=request.due_date,
        notes=request.notes,
        source=TaskSource.MANUAL,
    )
    session.add(minute_task)
    await session.commit()
    await session.refresh(minute_task)
    return MinuteTaskResponse.model_validate(minute_task)


@minutes_router.patch("/minutes/{minute_id}/tasks/{task_id}", response_model=MinuteTaskResponse)
async def patch_minute_task(
    minute_id: uuid.UUID,
    task_id: uuid.UUID,
    request: MinuteTaskPatchRequest,
    session: SQLSessionDep,
    user: UserDep,
) -> MinuteTaskResponse:
    minute = await get_minute(minute_id, session, user)
    task = await _get_task_for_minute(task_id, minute.id, session)
    if request.description is not None:
        task.description = request.description
    if request.owner is not None:
        task.owner = request.owner
    if request.owner_role is not None:
        task.owner_role = request.owner_role
    if request.due_date is not None:
        task.due_date = request.due_date
    if request.notes is not None:
        task.notes = request.notes
    if request.status is not None:
        task.status = request.status
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return MinuteTaskResponse.model_validate(task)


@minutes_router.post("/minutes/{minute_id}/tasks/push", response_model=MinuteTaskPushResponse)
async def push_minute_tasks(
    minute_id: uuid.UUID,
    session: SQLSessionDep,
    user: UserDep,
) -> MinuteTaskPushResponse:
    if not settings.MS_GRAPH_ENABLED:
        raise service_unavailable("Planner integration is disabled", ErrorCodes.FEATURE_DISABLED)
    minute = await get_minute(minute_id, session, user)
    latest_version = minute.minute_versions[0] if minute.minute_versions else None
    html_content = latest_version.html_content if latest_version else None
    await TaskExtractionService.sync_generated_tasks(minute.id, html_content)
    planner_ids = await TaskExtractionService.push_tasks_to_planner(minute.id, minute=minute)
    return MinuteTaskPushResponse(pushed=len(planner_ids), planner_task_ids=planner_ids)


@minutes_router.delete("/minute_versions/{minute_version_id}")
async def delete_minute_version(minute_version_id: uuid.UUID, session: SQLSessionDep, user: UserDep):
    query = (
        select(MinuteVersion)
        .where(MinuteVersion.id == minute_version_id)
        .options(selectinload(MinuteVersion.minute).selectinload(Minute.transcription))
    )
    minute_version = (await session.exec(query)).first()
    if (
        not minute_version
        or not minute_version.minute.transcription.user_id
        or minute_version.minute.transcription.user_id != user.id
        or minute_version.minute.organisation_id != user.organisation_id
        or (
            user.service_domain_id and minute_version.minute.service_domain_id != user.service_domain_id
        )
    ):
        raise not_found("MinuteVersion", ErrorCodes.MINUTE_VERSION_NOT_FOUND)

    await session.delete(minute_version)


@minutes_router.post("/minutes/{minute_id}/export", response_model=ExportResponse)
async def export_minute(  # noqa: PLR0913
    minute_id: uuid.UUID,
    session: SQLSessionDep,
    user: UserDep,
    format: str = Query("docx", pattern="^(docx|pdf)$"),
):
    minute = await get_minute(minute_id, session, user)
    if not minute.minute_versions:
        raise not_found("No minute versions found", ErrorCodes.MINUTE_VERSION_NOT_FOUND)

    latest_version = minute.minute_versions[0]
    if latest_version.status != JobStatus.COMPLETED:
        raise conflict("Minute still generating", ErrorCodes.STILL_PROCESSING)

    # Ensure exports exist or regenerate
    if minute.export_status != ExportStatus.COMPLETED or (
        format == "docx" and not minute.docx_blob_path
    ) or (format == "pdf" and not minute.pdf_blob_path):
        await ExportHandlerService.export_minute_version(latest_version.id, formats=[format])
        await session.refresh(minute)

    storage_service = get_storage_service(settings.STORAGE_SERVICE_NAME)
    key = minute.docx_blob_path if format == "docx" else minute.pdf_blob_path
    if not key:
        raise service_unavailable("Export is still processing", ErrorCodes.STILL_PROCESSING)

    filename = f"minute-{minute_id}.{format}"
    url = await storage_service.generate_presigned_url_get_object(
        key, filename, settings.EXPORT_URL_EXPIRY_SECONDS
    )
    sharepoint_id = minute.sharepoint_docx_item_id if format == "docx" else minute.sharepoint_pdf_item_id
    return ExportResponse(
        url=url, format=format, sharepoint_item_id=sharepoint_id, planner_task_ids=minute.planner_task_ids
    )
    await session.commit()


async def _get_task_for_minute(task_id: uuid.UUID, minute_id: uuid.UUID, session: SQLSessionDep) -> MinuteTask:
    result = await session.exec(
        select(MinuteTask).where(MinuteTask.id == task_id, MinuteTask.minute_id == minute_id)
    )
    task = result.first()
    if not task:
        raise not_found("Task", ErrorCodes.TASK_NOT_FOUND)
    return task
