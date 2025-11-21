"""
Tests for admin API endpoints (Phase 19B).

Tests unauthorized access blocking, config listing, detail views, audit trails,
and version history access for admin users only.

NOTE: These are smoke tests that verify the admin module imports correctly
and basic role checking logic works. Full integration tests with authentication
would require a complete test environment with JWT tokens and database setup.
"""

import pytest

from backend.api.routes.admin import check_admin_role
from backend.api.dependencies.get_current_user import AuthContext
from common.database.postgres_models import User, Role, Organisation


def test_check_admin_role_with_admin_email():
    """Test that admin@careminutes.local is recognized as admin."""
    # Create mock auth context
    user = User(email="admin@careminutes.local", data_retention_days=30)
    role = Role(name="user", description="Regular user")
    org = Organisation(name="Test Org")
    
    auth = AuthContext(
        user=user,
        organisation=org,
        service_domain=None,
        role=role,
        claims={},
        token="test-token"
    )
    
    assert check_admin_role(auth) is True


def test_check_admin_role_with_admin_role():
    """Test that admin role is recognized."""
    user = User(email="test@example.com", data_retention_days=30)
    role = Role(name="admin", description="Admin user")
    org = Organisation(name="Test Org")
    
    auth = AuthContext(
        user=user,
        organisation=org,
        service_domain=None,
        role=role,
        claims={},
        token="test-token"
    )
    
    assert check_admin_role(auth) is True


def test_check_admin_role_with_regular_user():
    """Test that regular users are not recognized as admin."""
    user = User(email="user@example.com", data_retention_days=30)
    role = Role(name="social_worker", description="Social worker")
    org = Organisation(name="Test Org")
    
    auth = AuthContext(
        user=user,
        organisation=org,
        service_domain=None,
        role=role,
        claims={},
        token="test-token"
    )
    
    assert check_admin_role(auth) is False


def test_check_admin_role_with_none():
    """Test that None auth is not recognized as admin."""
    assert check_admin_role(None) is False


def test_admin_module_imports():
    """Test that admin module can be imported without errors."""
    from backend.api.routes.admin import (
        admin_router,
        AccessCheckResponse,
        ConfigListResponse,
        ConfigAuditResponse,
        ConfigHistoryResponse,
    )
    
    assert admin_router is not None
    assert AccessCheckResponse is not None
    assert ConfigListResponse is not None
    assert ConfigAuditResponse is not None
    assert ConfigHistoryResponse is not None


def test_admin_router_registered():
    """Test that admin router is registered in the main API router."""
    from backend.api.routes import router
    
    # Check that admin routes are included
    routes = [route.path for route in router.routes]
    
    # Admin routes should be present
    admin_routes = [r for r in routes if '/admin/' in r]
    assert len(admin_routes) > 0, "Admin routes should be registered"
