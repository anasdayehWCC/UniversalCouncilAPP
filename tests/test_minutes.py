import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from backend.api.routes.minutes import minutes_router
from backend.api.dependencies.get_current_user import get_current_user, AuthContext
from backend.api.dependencies.get_session import get_session
from common.database.postgres_models import User, Organisation, ServiceDomain, Role, Minute, Transcription

# Setup a test app
app = FastAPI()
app.include_router(minutes_router)

@pytest.mark.asyncio
async def test_create_minute_with_case_context():
    """Test creating a minute and verifying case context is preserved."""
    
    # Mock AuthContext
    user_id = uuid4()
    org_id = uuid4()
    domain_id = uuid4()
    
    mock_user = User(id=user_id, email="test@example.com", organisation_id=org_id, service_domain_id=domain_id)
    mock_org = Organisation(id=org_id, name="Test Org")
    mock_domain = ServiceDomain(id=domain_id, name="Test Domain")
    mock_role = Role(name="CaseWorker")
    
    mock_auth_context = AuthContext(
        user=mock_user,
        organisation=mock_org,
        service_domain=mock_domain,
        role=mock_role,
        claims={},
        token="token"
    )
    
    # Mock Session
    mock_session = AsyncMock()
    
    # Mock Transcription lookup
    transcription_id = uuid4()
    case_id = uuid4()
    case_ref = "CASE-123"
    
    mock_transcription = Transcription(
        id=transcription_id,
        case_id=case_id,
        case_reference=case_ref,
        worker_team="Team A",
        subject_initials="JD",
        subject_dob_ciphertext="encrypted",
        organisation_id=org_id,
        service_domain_id=domain_id
    )
    
    mock_session.get.return_value = mock_transcription
    
    # Override dependencies
    app.dependency_overrides[get_current_user] = lambda: mock_auth_context
    app.dependency_overrides[get_session] = lambda: mock_session
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "transcription_id": str(transcription_id),
            "template_id": str(uuid4()),
            "template_name": "Assessment",
            "agenda": "Discuss progress"
        }
        
        response = await ac.post("/create-minute", json=payload)
        
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["case_reference"] == case_ref
    assert data["worker_team"] == "Team A"
    
    # Verify DB interactions
    # Should have added a Minute object
    assert mock_session.add.called
    added_minute = mock_session.add.call_args[0][0]
    assert isinstance(added_minute, Minute)
    assert added_minute.case_reference == case_ref
    assert added_minute.organisation_id == org_id
