from fastapi import APIRouter, HTTPException, Query
from sqlmodel import col, select

from backend.api.dependencies import SQLSessionDep, UserDep
from common.database.postgres_models import Minute, MinuteTask, TaskStatus
from common.types import MinuteTaskListItemResponse, MinuteTaskResponse


tasks_router = APIRouter(tags=["Tasks"])


@tasks_router.get("/tasks", response_model=list[MinuteTaskListItemResponse])
async def list_my_tasks(
    session: SQLSessionDep,
    user: UserDep,
    status: TaskStatus | None = Query(default=None, description="Optional status filter"),
) -> list[MinuteTaskListItemResponse]:
    query = (
        select(MinuteTask, Minute)
        .join(Minute, Minute.id == MinuteTask.minute_id)
        .where(Minute.organisation_id == user.organisation_id)
        .order_by(col(MinuteTask.created_datetime).desc())
    )
    if user.service_domain_id:
        query = query.where(MinuteTask.service_domain_id == user.service_domain_id)
    if status:
        query = query.where(MinuteTask.status == status)
    if not user.id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    query = query.where(Minute.created_by_user_id == user.id)

    results = await session.exec(query)
    rows = results.all()
    items: list[MinuteTaskListItemResponse] = []
    for task, minute in rows:
        base = MinuteTaskResponse.model_validate(task).model_dump()
        items.append(
            MinuteTaskListItemResponse(
                **base,
                case_reference=minute.case_reference,
                template_name=minute.template_name,
                transcription_id=minute.transcription_id,
                minute_updated_datetime=minute.updated_datetime,
            )
        )
    return items
