from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from backend.api.dependencies.get_current_user import AuthContext
from common.config.models import ModuleConfig, TenantConfig
from common.database.postgres_models import Organisation, Role, User


def _build_admin_auth_context() -> AuthContext:
    user = User(id=uuid4(), email="admin@careminutes.local", data_retention_days=30)
    organisation = Organisation(id=uuid4(), name="Westminster City Council")
    role = Role(id=uuid4(), name="admin", description="Admin user")

    return AuthContext(
        user=user,
        organisation=organisation,
        service_domain=None,
        role=role,
        claims={},
        token="test-token",
    )


def _build_tenant_config() -> TenantConfig:
    return TenantConfig(
        id="wcc_children",
        name="Westminster Children's Services",
        version="1.0.0",
        defaultLocale="en-GB",
        service_domain="children",
        designTokens={"primaryColor": "#211551", "accentColor": "#9D581F"},
        retentionDaysDefault=365,
        modules=[
            ModuleConfig(id="recordings", enabled=True, label="Recordings"),
            ModuleConfig(id="minutes", enabled=True, label="Minutes"),
        ],
    )


def test_build_admin_settings_response_uses_seed_config_defaults():
    from backend.api.routes.admin import build_admin_settings_response

    response = build_admin_settings_response(_build_tenant_config(), None)

    assert response.tenantId == "wcc_children"
    assert response.name == "Westminster Children's Services"
    assert response.domain == "children"
    assert response.branding.primaryColor == "#211551"
    assert response.branding.accentColor == "#9D581F"
    assert response.compliance.dataRetentionDays == 365
    assert response.features.smartCapture is True
    assert response.features.offlineMode is True


def test_build_admin_settings_response_merges_override_payload():
    from backend.api.routes.admin import build_admin_settings_response
    from common.database.postgres_models import TenantAdminState

    state = TenantAdminState(
        tenant_id="wcc_children",
        settings_payload={
            "name": "Westminster Children and Families",
            "branding": {
                "primaryColor": "#004B65",
                "accentColor": "#7CAE22",
            },
            "features": {"smartCapture": False},
            "compliance": {"auditLogRetentionDays": 1095, "requireMfa": True},
            "notifications": {"emailEnabled": False, "slackEnabled": True},
        },
    )

    response = build_admin_settings_response(_build_tenant_config(), state)

    assert response.name == "Westminster Children and Families"
    assert response.branding.primaryColor == "#004B65"
    assert response.branding.accentColor == "#7CAE22"
    assert response.features.smartCapture is False
    assert response.compliance.auditLogRetentionDays == 1095
    assert response.compliance.requireMfa is True
    assert response.notifications.emailEnabled is False
    assert response.notifications.slackEnabled is True


@pytest.mark.asyncio
async def test_update_admin_settings_persists_override_and_audit_event():
    from backend.api.routes.admin import (
        AdminBrandingSettings,
        AdminComplianceSettings,
        AdminFeatureSettings,
        AdminNotificationSettings,
        UpdateAdminSettingsRequest,
        update_admin_settings,
    )
    from common.database.postgres_models import AuditEvent, TenantAdminState

    session = AsyncMock()
    session.add = MagicMock()
    result = MagicMock()
    result.first.return_value = None
    session.exec = AsyncMock(return_value=result)

    response = await update_admin_settings(
        "wcc_children",
        UpdateAdminSettingsRequest(
            name="Westminster Children and Families",
            branding=AdminBrandingSettings(primaryColor="#004B65", accentColor="#7CAE22"),
            features=AdminFeatureSettings(aiEdit=True, smartCapture=False, offlineMode=True, pushNotifications=False),
            compliance=AdminComplianceSettings(
                dataRetentionDays=400,
                auditLogRetentionDays=1095,
                requireMfa=True,
                allowedDomains=["wcc.gov.uk"],
            ),
            notifications=AdminNotificationSettings(emailEnabled=False, slackEnabled=True, webhookUrl="https://example.com/hook"),
        ),
        session,
        _build_admin_auth_context(),
    )

    assert response.name == "Westminster Children and Families"
    added_records = [call.args[0] for call in session.add.call_args_list]
    state_record = next(record for record in added_records if isinstance(record, TenantAdminState))
    audit_record = next(record for record in added_records if isinstance(record, AuditEvent))

    assert state_record.tenant_id == "wcc_children"
    assert state_record.settings_payload["name"] == "Westminster Children and Families"
    assert state_record.settings_payload["branding"]["primaryColor"] == "#004B65"
    assert state_record.settings_payload["compliance"]["auditLogRetentionDays"] == 1095
    assert audit_record.action == "admin_update_settings"
    assert audit_record.resource_type == "tenant_config"
    assert audit_record.details["tenant_id"] == "wcc_children"
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_admin_module_persists_module_override_and_audit_event():
    from backend.api.routes.admin import UpdateAdminModuleRequest, update_admin_module
    from common.database.postgres_models import AuditEvent, TenantAdminState

    session = AsyncMock()
    session.add = MagicMock()
    existing_state = TenantAdminState(
        tenant_id="wcc_children",
        settings_payload={},
        module_payload={"recordings": {"enabled": True, "settings": {"quality": "high"}}},
    )
    result = MagicMock()
    result.first.return_value = existing_state
    session.exec = AsyncMock(return_value=result)

    response = await update_admin_module(
        "wcc_children",
        "recordings",
        UpdateAdminModuleRequest(enabled=False, settings={"quality": "economy", "language": "en-GB"}),
        session,
        _build_admin_auth_context(),
    )

    assert response.id == "recordings"
    assert response.enabled is False
    assert response.settings == {"quality": "economy", "language": "en-GB"}
    assert existing_state.module_payload["recordings"]["enabled"] is False
    assert existing_state.module_payload["recordings"]["settings"]["quality"] == "economy"

    added_records = [call.args[0] for call in session.add.call_args_list]
    audit_record = next(record for record in added_records if isinstance(record, AuditEvent))
    assert audit_record.action == "admin_update_module"
    assert audit_record.details["module_id"] == "recordings"
    session.commit.assert_awaited_once()