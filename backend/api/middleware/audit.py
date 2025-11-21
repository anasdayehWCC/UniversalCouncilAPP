import logging
from datetime import UTC, datetime
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from common.database.postgres_database import SessionLocal
from common.database.postgres_models import AuditEvent

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, skip_paths: list[str] | None = None):
        super().__init__(app)
        self.skip_paths = skip_paths or []

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        response = await call_next(request)

        path = request.url.path
        if any(path.startswith(p) for p in self.skip_paths):
            return response

        try:
            auth_ctx = getattr(request.state, "auth_context", None)
            with SessionLocal() as session:
                event = AuditEvent(
                    created_datetime=datetime.now(tz=UTC),
                    user_id=getattr(auth_ctx, "id", None),
                    organisation_id=getattr(auth_ctx, "organisation_id", None),
                    service_domain_id=getattr(auth_ctx, "service_domain_id", None),
                    case_id=None,
                    resource_type=path.split("/")[2] if len(path.split("/")) > 2 else "unknown",
                    resource_id=None,
                    action=request.method.lower(),
                    outcome=str(response.status_code),
                    path=path,
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent"),
                )
                session.add(event)
                session.commit()
        except Exception:  # noqa: BLE001
            logger.exception("Failed to record audit event for path %s", path)
        return response
