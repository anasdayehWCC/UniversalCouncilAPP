import pytest
from datetime import datetime, UTC
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock

from backend.api.routes.users import (
    _get_or_create_user_preferences,
    get_user_preferences,
    update_user_preferences,
)
from common.database.postgres_models import ColorMode, User, UserPreference
from common.types import UserPreferencesUpdateRequest


@pytest.mark.asyncio
async def test_get_user_preferences_creates_missing_record():
    session = AsyncMock()
    session.add = MagicMock()
    result = MagicMock()
    result.first.return_value = None
    session.exec = AsyncMock(return_value=result)
    user = User(id=uuid4(), email="worker@example.com", data_retention_days=30)

    preference = await _get_or_create_user_preferences(session, user)

    assert preference.user_id == user.id
    assert preference.color_mode == ColorMode.SYSTEM.value
    session.add.assert_called_once()
    session.commit.assert_awaited_once()
    session.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_user_preferences_returns_existing_record():
    session = AsyncMock()
    session.add = MagicMock()
    user = User(id=uuid4(), email="worker@example.com", data_retention_days=30)
    preference = UserPreference(
        user_id=user.id,
        color_mode=ColorMode.DARK.value,
        updated_datetime=datetime.now(tz=UTC),
    )
    result = MagicMock()
    result.first.return_value = preference
    session.exec = AsyncMock(return_value=result)

    response = await get_user_preferences(session, user)

    assert response.color_mode == ColorMode.DARK
    assert response.synced is True
    session.add.assert_not_called()


@pytest.mark.asyncio
async def test_update_user_preferences_persists_color_mode():
    session = AsyncMock()
    session.add = MagicMock()
    user = User(id=uuid4(), email="worker@example.com", data_retention_days=30)
    preference = UserPreference(user_id=user.id, color_mode=ColorMode.LIGHT.value)
    result = MagicMock()
    result.first.return_value = preference
    session.exec = AsyncMock(return_value=result)

    response = await update_user_preferences(
        UserPreferencesUpdateRequest(color_mode=ColorMode.DARK),
        session,
        user,
    )

    assert response.color_mode == ColorMode.DARK
    assert preference.color_mode == ColorMode.DARK.value
    session.commit.assert_awaited()
    session.refresh.assert_awaited()
