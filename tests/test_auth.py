import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from fastapi import HTTPException
from backend.api.dependencies.get_current_user import get_current_user, AuthContext
from common.database.postgres_models import User, Organisation, ServiceDomain, Role, UserOrgRole

@pytest.mark.asyncio
async def test_get_current_user_local_dev_auto_login():
    """Test that local dev environment automatically logs in with a fake token if no header is provided."""
    mock_session = AsyncMock()
    
    # Mock settings to simulate local environment
    with patch("backend.api.dependencies.get_current_user.settings") as mock_settings:
        mock_settings.ENVIRONMENT = "local"
        mock_settings.DISABLE_LOCAL_FAKE_JWT = False
        mock_settings.AZURE_API_AUDIENCE = "api://minute-local"
        
        # Mock DB results for user lookup and creation
        # 1. User lookup (returns None, so it creates one)
        # 2. User creation (add/commit/refresh)
        # 3. Org/Role lookup (returns empty list initially)
        # 4. Seed entities lookup (returns None, so it creates them)
        # 5. Org/Role lookup again (returns the seeded assignment)
        
        # Setup mock entities
        user_id = uuid4()
        org_id = uuid4()
        domain_id = uuid4()
        role_id = uuid4()
        
        mock_user = User(id=user_id, email="local.dev@minute.test")
        mock_org = Organisation(id=org_id, name="Local Dev Council")
        mock_domain = ServiceDomain(id=domain_id, name="Children's Social Care", organisation_id=org_id)
        mock_role = Role(id=role_id, name="developer")
        mock_assignment = UserOrgRole(
            user_id=user_id, 
            organisation_id=org_id, 
            service_domain_id=domain_id, 
            role_id=role_id,
            organisation=mock_org,
            service_domain=mock_domain,
            role=mock_role
        )
        
        # Mock session.exec behavior
        # This is complex because get_current_user makes multiple calls.
        # We'll mock the return values of exec().first() and exec().all()
        
        # We can simplify by mocking the internal helper _ensure_local_seed_entities if we want, 
        # but let's try to mock the session responses.
        
        # However, since we are mocking the session, we can just ensure it returns what we expect 
        # for the final query that retrieves the user roles.
        
        # Let's mock the entire flow more simply:
        # The function will try to find the user. Let's say it finds it.
        mock_session.exec.return_value.first.side_effect = [
            mock_user, # User lookup
            # _ensure_local_seed_entities lookups (org, domain, role)
            mock_org, 
            mock_domain,
            mock_role
        ]
        
        # The function will look up roles.
        # First call returns empty (triggering seed), second call returns assignment.
        mock_session.exec.return_value.all.side_effect = [
            [], # First role lookup
            [mock_assignment] # Second role lookup after seeding
        ]
        
        auth_context = await get_current_user(mock_session, authorization=None)
        
        assert isinstance(auth_context, AuthContext)
        assert auth_context.user.email == "local.dev@minute.test"
        assert auth_context.organisation.name == "Local Dev Council"
        assert auth_context.role.name == "developer"

@pytest.mark.asyncio
async def test_get_current_user_rls_enforcement():
    """Test that get_current_user enforces RLS based on token claims."""
    mock_session = AsyncMock()
    
    # Mock settings
    with patch("backend.api.dependencies.get_current_user.settings") as mock_settings:
        mock_settings.ENVIRONMENT = "production" # Force token validation path
        mock_settings.AZURE_TENANT_ID = "tenant-123"
        mock_settings.AZURE_API_AUDIENCE = "api://minute"
        
        # Mock JWT decoding
        with patch("jwt.decode") as mock_jwt_decode, \
             patch("backend.api.dependencies.get_current_user.get_jwks_client") as mock_jwks_client:
            
            mock_jwks_client.return_value.get_signing_key_from_jwt.return_value.key = "public_key"
            
            user_id = uuid4()
            org_id = uuid4()
            other_org_id = uuid4()
            
            # Case 1: User has access to the requested org
            mock_jwt_decode.return_value = {
                "preferred_username": "user@example.com",
                "roles": ["CaseWorker"],
                "organisation_id": str(org_id)
            }
            
            mock_user = User(id=user_id, email="user@example.com")
            mock_assignment = UserOrgRole(
                user_id=user_id,
                organisation_id=org_id,
                role=Role(name="CaseWorker"),
                organisation=Organisation(id=org_id),
                service_domain=ServiceDomain(id=uuid4())
            )
            
            mock_session.exec.return_value.first.return_value = mock_user
            mock_session.exec.return_value.all.return_value = [mock_assignment]
            
            auth_context = await get_current_user(mock_session, authorization="Bearer token")
            assert auth_context.organisation.id == org_id
            
            # Case 2: User does NOT have access to the requested org
            mock_jwt_decode.return_value = {
                "preferred_username": "user@example.com",
                "roles": ["CaseWorker"],
                "organisation_id": str(other_org_id) # Requesting different org
            }
            
            # Reset mocks
            mock_session.exec.return_value.first.return_value = mock_user
            mock_session.exec.return_value.all.return_value = [mock_assignment] # User only has access to org_id
            
            with pytest.raises(HTTPException) as exc:
                await get_current_user(mock_session, authorization="Bearer token")
            assert exc.value.status_code == 403
