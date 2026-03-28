import uuid
from fastapi import APIRouter, Query
from sqlalchemy import func
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from sqlmodel import select

from backend.api.dependencies import SQLSessionDep, UserDep
from common.errors import ErrorCodes, not_found
from common.types import SourceCheckResponse
from common.database.postgres_models import Minute

tags_router = APIRouter(tags=["Minutes"])


class TagsUpdateRequest(BaseModel):
    tags: list[str]

@tags_router.get("/tags", response_model=list[str])
async def list_available_tags(
    session: SQLSessionDep,
    user: UserDep,
    search: str | None = Query(default=None, min_length=1, description="Filter tags containing this text"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum number of tags to return"),
) -> list[str]:
    base = select(func.distinct(func.jsonb_array_elements_text(Minute.tags))).where(
        Minute.organisation_id == user.organisation_id,
        Minute.tags.is_not(None),
    )
    if user.service_domain_id:
        base = base.where(Minute.service_domain_id == user.service_domain_id)
    if search:
        base = base.where(func.jsonb_array_elements_text(Minute.tags).ilike(f"%{search}%"))
    base = base.limit(limit)
    result = await session.exec(base)
    tags = [row[0] for row in result.all() if row and row[0]]
    return tags


@tags_router.get("/minutes/{minute_id}/tags", response_model=list[str])
async def get_tags(minute_id: uuid.UUID, session: SQLSessionDep, user: UserDep) -> list[str]:
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
    return minute.tags or []


@tags_router.put("/minutes/{minute_id}/tags", response_model=list[str])
async def update_tags(
    minute_id: uuid.UUID,
    request: TagsUpdateRequest,
    session: SQLSessionDep,
    user: UserDep,
) -> list[str]:
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
    minute.tags = request.tags or []
    await session.commit()
    await session.refresh(minute)
    return minute.tags
