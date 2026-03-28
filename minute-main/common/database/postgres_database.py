import asyncio
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import Session, and_, col, create_engine, delete, or_, select, update

from common.database.postgres_models import (
    JobStatus,
    Minute,
    MinuteVersion,
    Recording,
    RetentionPolicy,
    Transcription,
    User,
)
from common.services.storage_services import get_storage_service
from common.settings import get_settings

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)


# Only create the settings object once

settings = get_settings()

storage_service = get_storage_service(settings.STORAGE_SERVICE_NAME)

# Get database connection details from environment variables
DB_USER = settings.POSTGRES_USER
DB_HOST = settings.POSTGRES_HOST
DB_PORT = settings.POSTGRES_PORT
DB_NAME = settings.POSTGRES_DB
DB_AUTH_MODE = settings.POSTGRES_AUTH_MODE

def _get_db_password() -> str:
    if DB_AUTH_MODE == "managed_identity":
        credential = DefaultAzureCredential(managed_identity_client_id=settings.AZURE_MANAGED_IDENTITY_CLIENT_ID)
        token = credential.get_token("https://ossrdbms-aad.database.windows.net/.default")
        return token.token
    return settings.POSTGRES_PASSWORD

DB_PASSWORD = _get_db_password()

# Use psycopg2 for synchronous operations
SYNC_DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# Use asyncpg for asynchronous operations
ASYNC_DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SYNC_DATABASE_URL, pool_size=20, max_overflow=30, pool_timeout=60, pool_pre_ping=True)

async_engine = create_async_engine(
    ASYNC_DATABASE_URL, pool_size=20, max_overflow=30, pool_timeout=60, pool_pre_ping=True
)


def SessionLocal() -> Session:  # noqa: N802
    """Sync session factory for background jobs and CLI scripts only.
    
    Do NOT use in async contexts (FastAPI routes, async service methods).
    For async contexts, use async_session_factory() instead.
    """
    return Session(engine)


@asynccontextmanager
async def async_session_factory():
    """Async session factory for handler services and worker actors.
    
    Use this in any async context that needs database access:
    
        async with async_session_factory() as session:
            result = await session.execute(stmt)
    
    Note: expire_on_commit=False to allow accessing attributes after commit.
    """
    async with AsyncSession(async_engine, expire_on_commit=False) as session:
        yield session


def cleanup_failed_records():
    """
    DEPRECATED: Use retention_service.run_consolidated_retention_cleanup() instead.
    
    This function is kept for backwards compatibility but is no longer called by the scheduler.
    """
    logger.warning("cleanup_failed_records() is deprecated - use retention_service instead")
    from common.services.retention_service import cleanup_failed_records as new_cleanup
    with Session(engine) as session:
        new_cleanup(session)


def cleanup_old_records():
    """
    DEPRECATED: Use retention_service.run_consolidated_retention_cleanup() instead.
    
    This function had a critical bug where database records were deleted even when
    blob deletion failed (due to the try/finally pattern). The new retention service
    fixes this by deleting blobs FIRST, then database records only on success.
    """
    logger.warning("cleanup_old_records() is deprecated - use retention_service instead")
    # Do not call the old logic - it has the bug where DB deletes even if blob deletion fails


def _run_retention_cleanup_sync():
    """
    Synchronous wrapper for the async retention cleanup service.
    
    Used by APScheduler which expects synchronous job functions.
    """
    from common.services.retention_service import run_consolidated_retention_cleanup
    
    try:
        with Session(engine) as session:
            # Run the async cleanup in the existing event loop or create new one
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            loop.run_until_complete(run_consolidated_retention_cleanup(session))
    except Exception as exc:
        logger.exception(f"Retention cleanup job failed: {exc}")


def init_cleanup_scheduler():
    """
    Initialize the consolidated retention cleanup scheduler.
    
    Uses a SINGLE scheduled job with distributed locking to prevent concurrent runs.
    Replaces the previous separate cleanup_old_records() and cleanup_failed_records() jobs.
    
    Configuration:
        - RETENTION_CLEANUP_ENABLED: Enable/disable cleanup (default: True)
        - RETENTION_CLEANUP_INTERVAL_HOURS: Hours between runs (default: 24)
        - RETENTION_LOCK_TIMEOUT_SECONDS: Lock timeout (default: 300)
        - STORAGE_DELETE_MAX_RETRIES: Blob deletion retries (default: 3)
    """
    if not settings.RETENTION_CLEANUP_ENABLED:
        logger.info("Retention cleanup scheduler disabled via RETENTION_CLEANUP_ENABLED=False")
        return
    
    scheduler = BackgroundScheduler()
    
    # Single consolidated cleanup job
    interval_hours = settings.RETENTION_CLEANUP_INTERVAL_HOURS
    scheduler.add_job(
        _run_retention_cleanup_sync,
        "interval",
        hours=interval_hours,
        id="consolidated_retention_cleanup",
        name="Consolidated Retention Cleanup (with locking)",
        max_instances=1,  # Prevent overlapping runs
        coalesce=True,    # If multiple runs are pending, combine them
    )
    
    scheduler.start()
    
    logger.info(
        f"Retention cleanup scheduler initialized: running every {interval_hours} hours "
        f"(lock timeout: {settings.RETENTION_LOCK_TIMEOUT_SECONDS}s, "
        f"max retries: {settings.STORAGE_DELETE_MAX_RETRIES})"
    )
    
    # Optional: Run cleanup immediately on startup (useful for testing)
    # _run_retention_cleanup_sync()
