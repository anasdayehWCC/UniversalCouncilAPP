import logging
from datetime import UTC, datetime

from fastapi import APIRouter
from sqlmodel import select

from backend.api.dependencies import SQLSessionDep, UserDep
from common.errors import ErrorCodes, bad_request, forbidden
from common.database.postgres_models import UserPreference
from common.types import DataRetentionUpdateResponse, GetUserResponse, UserPreferencesResponse, UserPreferencesUpdateRequest

users_router = APIRouter(tags=["Users"])

logger = logging.getLogger(__name__)


async def _get_or_create_user_preferences(session: SQLSessionDep, user: UserDep) -> UserPreference:
    preferences = (await session.exec(select(UserPreference).where(UserPreference.user_id == user.id))).first()
    if preferences:
        return preferences

    preferences = UserPreference(user_id=user.id)
    session.add(preferences)
    await session.commit()
    await session.refresh(preferences)
    return preferences


@users_router.get("/users/me")
def get_user(user: UserDep) -> GetUserResponse:
    return GetUserResponse(
        id=user.id,
        created_datetime=user.created_datetime,
        updated_datetime=user.updated_datetime,
        email=user.email,
        data_retention_days=user.data_retention_days,
        strict_data_retention=user.strict_data_retention,
    )


@users_router.patch("/users/data-retention", response_model=GetUserResponse)
async def update_data_retention(
    data: DataRetentionUpdateResponse,
    session: SQLSessionDep,
    user: UserDep,
) -> GetUserResponse:
    """Update the data retention period for the current user.

    Args:
        data: Request body containing data_retention_days
        current_user: The current authenticated user
    """
    if user.strict_data_retention:
        raise forbidden(
            "Strict data retention enabled, you cannot update your data retention.",
            ErrorCodes.FORBIDDEN,
        )

    if data.data_retention_days is not None and data.data_retention_days < 1:
        raise bad_request(
            "Data retention period must be at least 1 day or None for indefinite retention",
            ErrorCodes.VALIDATION_ERROR,
        )

    user.data_retention_days = data.data_retention_days
    user.updated_datetime = datetime.now(tz=UTC)

    await session.commit()
    await session.refresh(user)

    logger.info(
        "Updated data retention period to %s days for user %s",
        data.data_retention_days,
        user.id,
    )

    return GetUserResponse(
        id=user.id,
        created_datetime=user.created_datetime,
        updated_datetime=user.updated_datetime,
        email=user.email,
        data_retention_days=user.data_retention_days,
        strict_data_retention=user.strict_data_retention,
    )


@users_router.get("/users/me/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(session: SQLSessionDep, user: UserDep) -> UserPreferencesResponse:
    """Return the current user's appearance preferences."""
    preferences = await _get_or_create_user_preferences(session, user)
    return UserPreferencesResponse(
        color_mode=preferences.color_mode,
        updated_datetime=preferences.updated_datetime,
        synced=True,
    )


@users_router.patch("/users/me/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    data: UserPreferencesUpdateRequest,
    session: SQLSessionDep,
    user: UserDep,
) -> UserPreferencesResponse:
    """Update the current user's appearance preferences."""
    preferences = await _get_or_create_user_preferences(session, user)
    preferences.color_mode = data.color_mode.value if hasattr(data.color_mode, "value") else str(data.color_mode)
    preferences.updated_datetime = datetime.now(tz=UTC)

    await session.commit()
    await session.refresh(preferences)

    logger.info("Updated appearance preferences for user %s to %s", user.id, preferences.color_mode)

    return UserPreferencesResponse(
        color_mode=preferences.color_mode,
        updated_datetime=preferences.updated_datetime,
        synced=True,
    )
