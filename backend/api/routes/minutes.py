import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import col, select

from backend.api.dependencies import SQLSessionDep, UserDep
from common.database.postgres_models import ExportStatus, JobStatus, Minute, MinuteVersion, Transcription
from common.services.export_handler_service import ExportHandlerService
from common.services.storage_services import get_storage_service
from common.services.queue_services import get_queue_service
from common.settings import get_settings
from common.config.access import is_module_enabled
from common.telemetry.events import build_context, record_module_access, TelemetryContext
from common.types import (
    EditMessageData,
    ExportResponse,
    MinuteListItem,
    MinutesCreateRequest,
    MinuteVersionCreateRequest,
    MinuteVersionResponse,
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
        raise HTTPException(status_code=403, detail="Minutes module is disabled for this tenant")
    return context


@minutes_router.get("/transcription/{transcription_id}/minutes")
async def list_minutes_for_transcription(
    transcription_id: uuid.UUID, session: SQLSessionDep, user: UserDep
) -> list[MinuteListItem]:
    ensure_minutes_module_enabled(user)
    transcription = await session.get(Transcription, transcription_id)
    if (
        not transcription
        or transcription.user_id != user.id
        or transcription.organisation_id != user.organisation_id
        or (user.service_domain_id and transcription.service_domain_id != user.service_domain_id)
    ):
        raise HTTPException(404, "Not found")

    query = select(Minute).where(
        Minute.transcription_id == transcription_id,
        Minute.organisation_id == user.organisation_id,
    )
    if user.service_domain_id:
        query = query.where(Minute.service_domain_id == user.service_domain_id)
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
        raise HTTPException(404, "Not found")
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


@minutes_router.get("/minutes/{minutes_id}")
async def get_minute(minutes_id: uuid.UUID, session: SQLSessionDep, user: UserDep) -> Minute:
    ensure_minutes_module_enabled(user)
    query = (
        select(Minute)
        .where(Minute.id == minutes_id)
        .options(selectinload(Minute.transcription), selectinload(Minute.minute_versions))
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
        raise HTTPException(404, "Not found")

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
        raise HTTPException(404)

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
        raise HTTPException(404, "Not found")

    return minute_version


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
        raise HTTPException(404, "Not found")

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
        raise HTTPException(404, "No minute versions found")

    latest_version = minute.minute_versions[0]
    if latest_version.status != JobStatus.COMPLETED:
        raise HTTPException(409, "Minute still generating")

    # Ensure exports exist or regenerate
    if minute.export_status != ExportStatus.COMPLETED or (
        format == "docx" and not minute.docx_blob_path
    ) or (format == "pdf" and not minute.pdf_blob_path):
        await ExportHandlerService.export_minute_version(latest_version.id, formats=[format])
        await session.refresh(minute)

    storage_service = get_storage_service(settings.STORAGE_SERVICE_NAME)
    key = minute.docx_blob_path if format == "docx" else minute.pdf_blob_path
    if not key:
        raise HTTPException(503, "Export is still processing")

    filename = f"minute-{minute_id}.{format}"
    url = await storage_service.generate_presigned_url_get_object(
        key, filename, settings.EXPORT_URL_EXPIRY_SECONDS
    )
    sharepoint_id = minute.sharepoint_docx_item_id if format == "docx" else minute.sharepoint_pdf_item_id
    return ExportResponse(
        url=url, format=format, sharepoint_item_id=sharepoint_id, planner_task_ids=minute.planner_task_ids
    )
    await session.commit()
