import logging
from contextlib import asynccontextmanager

import sentry_sdk
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from prometheus_fastapi_instrumentator import Instrumentator

from backend.api.routes import router as api_router
from common.errors import APIException
from backend.api.middleware.audit import AuditMiddleware
from backend.api.middleware.security import OriginCheckMiddleware, SecurityHeadersMiddleware, SimpleRateLimitMiddleware
from backend.api.middleware.tracing import TracingMiddleware
from common.database.postgres_database import init_cleanup_scheduler
from common.settings import get_settings

settings = get_settings()
log = logging.getLogger("uvicorn")


@asynccontextmanager
async def lifespan(app_: FastAPI):  # noqa: ARG001
    log.info("Starting up...")

    init_cleanup_scheduler()

    yield

    log.info("Shutting down...")


# init sentry, if used
if settings.SENTRY_DSN:
    if settings.ENVIRONMENT == "prod":
        sentry_init_opts = {"traces_sample_rate": 1.0, "profile_session_sample_rate": 0.2}
    else:
        sentry_init_opts = {
            "send_default_pii": True,
            "traces_sample_rate": 1.0,
            "profile_session_sample_rate": 1.0,
            "profile_lifecycle": "trace",
        }
    sentry_sdk.init(settings.SENTRY_DSN, environment=settings.ENVIRONMENT, **sentry_init_opts)
app = FastAPI(lifespan=lifespan, openapi_url="/api/openapi.json")


@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """Handle APIException with structured error response.
    
    Strips context field in production to avoid leaking internal details.
    """
    detail = exc.detail
    
    # Strip context in production
    if settings.ENVIRONMENT == "prod" and isinstance(detail, dict):
        detail.pop("context", None)
    
    log.warning(
        "API error: %s %s - %s",
        exc.status_code,
        request.url.path,
        detail.get("message") if isinstance(detail, dict) else detail,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail},
        headers=exc.headers or {},
    )


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Configure CORS

origins = [settings.APP_URL]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TracingMiddleware)
app.add_middleware(OriginCheckMiddleware, allowed_origins=origins)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    SimpleRateLimitMiddleware,
    limit=120,
    window_seconds=60,
    protected_paths=["/api/recordings", "/api/transcriptions", "/api/minutes", "/api/users"],
)
app.add_middleware(AuditMiddleware, skip_paths=["/api/health", "/health", "/unauthorised/health"])

app.include_router(api_router)

if settings.METRICS_ENABLED:
    Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

if settings.STORAGE_SERVICE_NAME == "local":
    from common.services.storage_services.local.mock_storage_service import mock_storage_app

    log.info(
        "Using 'local' storage service. We recommend only using this for development. "
        "Uploaded files are stored in .data/",
    )
    app.mount("/mock_storage", mock_storage_app)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080)  # noqa: S104
