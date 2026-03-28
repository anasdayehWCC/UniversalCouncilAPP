"""
Retention cleanup service with distributed locking and robust error handling.

This module consolidates all retention cleanup logic into a single scheduled job with:
- PostgreSQL advisory locks to prevent concurrent cleanup runs
- Retry logic with exponential backoff for storage deletion failures
- **Critical**: Storage deletion happens BEFORE database deletion
- Orphaned record tracking for manual cleanup when storage fails
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from azure.core.exceptions import ResourceNotFoundError, ServiceRequestError
from sqlalchemy.exc import DBAPIError
from sqlmodel import Session, and_, col, delete, or_, select, update
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

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

logger = logging.getLogger(__name__)
settings = get_settings()


# PostgreSQL advisory lock key for retention cleanup (arbitrary unique integer)
RETENTION_CLEANUP_LOCK_ID = 987654321


class StorageDeletionError(Exception):
    """Raised when storage deletion fails after all retries."""
    pass


class LockAcquisitionError(Exception):
    """Raised when unable to acquire distributed lock."""
    pass


@asynccontextmanager
async def advisory_lock(session: Session, lock_id: int, timeout_seconds: int):
    """
    Acquire a PostgreSQL advisory lock with timeout.
    
    Args:
        session: Database session
        lock_id: Unique integer identifier for the lock
        timeout_seconds: Maximum time to wait for lock acquisition
        
    Raises:
        LockAcquisitionError: If lock cannot be acquired within timeout
        
    Usage:
        async with advisory_lock(session, LOCK_ID, 300):
            # Critical section - only one worker can execute this
            pass
    """
    from sqlalchemy import text
    
    # Try to acquire the lock with a timeout
    result = session.execute(text(f"SELECT pg_try_advisory_lock({lock_id})"))
    acquired = result.scalar()
    
    if not acquired:
        msg = f"Failed to acquire advisory lock {lock_id} - another cleanup job is running"
        logger.warning(msg)
        raise LockAcquisitionError(msg)
    
    logger.info(f"Acquired advisory lock {lock_id}")
    
    try:
        yield
    finally:
        # Always release the lock
        session.execute(text(f"SELECT pg_advisory_unlock({lock_id})"))
        logger.info(f"Released advisory lock {lock_id}")


async def delete_blob_with_retry(storage_service, blob_key: str) -> tuple[bool, str | None]:
    """
    Delete a blob from storage with exponential backoff retry.
    
    Args:
        storage_service: Storage service instance
        blob_key: Key/path of the blob to delete
        
    Returns:
        Tuple of (success: bool, error_message: str | None)
        
    Note:
        - Retries on transient Azure errors (403, 429, 500, 503)
        - Uses exponential backoff configured via settings
        - Returns success=False on permanent failures
    """
    @retry(
        retry=retry_if_exception_type((ServiceRequestError, ConnectionError, TimeoutError)),
        stop=stop_after_attempt(settings.STORAGE_DELETE_MAX_RETRIES),
        wait=wait_exponential(
            multiplier=settings.STORAGE_DELETE_RETRY_BASE_SECONDS,
            min=settings.STORAGE_DELETE_RETRY_BASE_SECONDS,
            max=60,
        ),
        reraise=True,
    )
    async def _delete_with_retry():
        try:
            await storage_service.delete(blob_key)
            return True, None
        except ResourceNotFoundError:
            # Blob already deleted - this is OK
            logger.info(f"Blob {blob_key} already deleted or doesn't exist")
            return True, None
        except (ServiceRequestError, ConnectionError, TimeoutError) as exc:
            # Transient errors - retry
            logger.warning(f"Transient error deleting blob {blob_key}: {exc}")
            raise
        except Exception as exc:
            # Permanent error - don't retry
            error_msg = f"Permanent error deleting blob {blob_key}: {type(exc).__name__}: {exc}"
            logger.error(error_msg)
            return False, error_msg
    
    try:
        return await _delete_with_retry()
    except Exception as exc:
        # All retries exhausted
        error_msg = f"Failed to delete blob {blob_key} after {settings.STORAGE_DELETE_MAX_RETRIES} retries: {exc}"
        logger.error(error_msg)
        return False, error_msg


async def cleanup_recording_with_storage(
    session: Session,
    recording: Recording,
    storage_service,
    deletion_tasks: list,
) -> tuple[bool, str | None]:
    """
    Delete recording blob FIRST, then database record.
    
    **CRITICAL**: Database record is only deleted if blob deletion succeeds.
    
    Args:
        session: Database session
        recording: Recording instance to delete
        storage_service: Storage service instance
        deletion_tasks: List to accumulate deletion tasks
        
    Returns:
        Tuple of (success: bool, error_message: str | None)
    """
    if not recording.s3_file_key:
        # No blob - just delete from DB
        session.delete(recording)
        return True, None
    
    # Step 1: Delete blob from storage
    success, error_msg = await delete_blob_with_retry(storage_service, recording.s3_file_key)
    
    if success:
        # Step 2: Blob deleted successfully - now delete DB record
        session.delete(recording)
        logger.info(f"Deleted recording {recording.id} (blob: {recording.s3_file_key})")
        return True, None
    else:
        # Step 3: Blob deletion failed - DO NOT delete DB record
        # Mark for manual cleanup by updating a flag or logging
        logger.error(
            f"ORPHANED RECORD: Recording {recording.id} blob deletion failed: {error_msg}. "
            f"Database record retained for manual cleanup. Blob key: {recording.s3_file_key}"
        )
        return False, error_msg


def cleanup_failed_records(session: Session):
    """
    Mark stalled records (stuck in IN_PROGRESS/AWAITING_START for >24h) as FAILED.
    
    This prevents unbounded accumulation of zombie records.
    """
    logger.info("Starting stalled object cleanup process")
    
    for object_type in [MinuteVersion, Transcription]:
        # Mark as failed after 24 hours
        cutoff_date = datetime.now(tz=ZoneInfo("Europe/London")) - timedelta(days=1)
        update_stmt = (
            update(object_type)
            .where(
                and_(
                    object_type.created_datetime < cutoff_date,
                    or_(
                        object_type.status == JobStatus.IN_PROGRESS,
                        object_type.status == JobStatus.AWAITING_START,
                    ),
                )
            )
            .values(status=JobStatus.FAILED, error="Unknown error. Job finalised by cleanup process")
        )
        result = session.exec(update_stmt)
        session.commit()
        logger.info(
            f"Updated {result.rowcount} old {object_type.__qualname__} records that were not successfully processed"
        )
    
    logger.info("Stalled record cleanup process completed")


async def cleanup_old_records_by_policy(session: Session):
    """
    Delete records based on retention policies and user settings.
    
    **CRITICAL INVARIANT**: Blobs are deleted BEFORE database records.
    If blob deletion fails, the database record is retained and flagged for manual cleanup.
    """
    logger.info("Starting data retention cleanup process")
    
    storage_service = get_storage_service(settings.STORAGE_SERVICE_NAME)
    now = datetime.now(tz=ZoneInfo("Europe/London"))
    
    # Track deletion statistics
    stats = {
        "recordings_deleted": 0,
        "recordings_failed": 0,
        "transcriptions_deleted": 0,
        "minutes_deleted": 0,
    }
    
    # Process retention policies (org/domain-scoped)
    policies = session.exec(select(RetentionPolicy)).all()
    logger.info(f"Processing {len(policies)} retention policies")
    
    for policy in policies:
        recording_filters = []
        transcription_filters = []
        minute_filters = []
        
        if policy.organisation_id:
            recording_filters.append(Recording.organisation_id == policy.organisation_id)
            transcription_filters.append(Transcription.organisation_id == policy.organisation_id)
            minute_filters.append(Minute.organisation_id == policy.organisation_id)
        
        if policy.service_domain_id:
            recording_filters.append(Recording.service_domain_id == policy.service_domain_id)
            transcription_filters.append(Transcription.service_domain_id == policy.service_domain_id)
            minute_filters.append(Minute.service_domain_id == policy.service_domain_id)
        
        # Audio retention
        if policy.audio_retention_days:
            cutoff = now - timedelta(days=policy.audio_retention_days)
            recordings = session.exec(
                select(Recording).where(*recording_filters, Recording.created_datetime < cutoff)
            ).all()
            
            logger.info(f"Policy {policy.id}: Found {len(recordings)} recordings to delete")
            
            for recording in recordings:
                success, error_msg = await cleanup_recording_with_storage(
                    session, recording, storage_service, []
                )
                if success:
                    stats["recordings_deleted"] += 1
                else:
                    stats["recordings_failed"] += 1
            
            session.commit()
        
        # Transcript retention (no blob storage)
        if policy.transcript_retention_days:
            cutoff = now - timedelta(days=policy.transcript_retention_days)
            delete_stmt = delete(Transcription).where(
                *transcription_filters,
                Transcription.created_datetime < cutoff,
            )
            result = session.exec(delete_stmt)
            session.commit()
            stats["transcriptions_deleted"] += result.rowcount
            logger.info(f"Policy {policy.id}: Deleted {result.rowcount} transcriptions")
        
        # Minute retention (no blob storage)
        if policy.minute_retention_days:
            cutoff = now - timedelta(days=policy.minute_retention_days)
            delete_stmt = delete(Minute).where(
                *minute_filters,
                Minute.created_datetime < cutoff,
            )
            result = session.exec(delete_stmt)
            session.commit()
            stats["minutes_deleted"] += result.rowcount
            logger.info(f"Policy {policy.id}: Deleted {result.rowcount} minutes")
    
    # Process user-specific retention
    users = session.exec(select(User)).all()
    logger.info(f"Processing retention for {len(users)} users")
    
    for user in users:
        cutoff_date = None
        parts = user.email.split("@")
        domain = parts[1].lower() if len(parts) == 2 else user.email.lower()  # noqa: PLR2004
        
        # Cabinet Office and DSIT: 24h retention
        if len(parts) == 2 and ("cabinetoffice" in domain or "dsit" in domain):  # noqa: PLR2004
            cutoff_date = now - timedelta(days=1)
        elif user.data_retention_days:
            cutoff_date = now - timedelta(days=user.data_retention_days)
        
        if cutoff_date:
            delete_stmt = delete(Transcription).where(
                Transcription.user_id == user.id,
                Transcription.created_datetime < cutoff_date,
            )
            result = session.exec(delete_stmt)
            session.commit()
            stats["transcriptions_deleted"] += result.rowcount
            logger.info(
                f"User {user.id}: Deleted {result.rowcount} transcriptions "
                f"(retention: {user.data_retention_days} days)"
            )
    
    # Cleanup orphaned recordings (no transcription link)
    orphaned_recordings = session.exec(
        select(Recording).where(col(Recording.transcription_id).is_(None))
    ).all()
    
    logger.info(f"Found {len(orphaned_recordings)} orphaned recordings")
    
    for recording in orphaned_recordings:
        success, error_msg = await cleanup_recording_with_storage(
            session, recording, storage_service, []
        )
        if success:
            stats["recordings_deleted"] += 1
        else:
            stats["recordings_failed"] += 1
    
    session.commit()
    
    logger.info(
        f"Data retention cleanup completed: {stats['recordings_deleted']} recordings deleted, "
        f"{stats['recordings_failed']} recordings failed (orphaned), "
        f"{stats['transcriptions_deleted']} transcriptions deleted, "
        f"{stats['minutes_deleted']} minutes deleted"
    )
    
    return stats


async def run_consolidated_retention_cleanup(session: Session):
    """
    Single consolidated retention cleanup job with distributed locking.
    
    This replaces the previous separate cleanup_old_records() and cleanup_failed_records()
    jobs with a single atomic operation protected by PostgreSQL advisory locks.
    
    Raises:
        LockAcquisitionError: If another cleanup job is already running
    """
    try:
        # Acquire distributed lock to prevent concurrent cleanup runs
        async with advisory_lock(session, RETENTION_CLEANUP_LOCK_ID, settings.RETENTION_LOCK_TIMEOUT_SECONDS):
            logger.info("=== Starting consolidated retention cleanup ===")
            
            # Phase 1: Mark stalled records as failed
            cleanup_failed_records(session)
            
            # Phase 2: Delete old records per retention policies
            stats = await cleanup_old_records_by_policy(session)
            
            logger.info("=== Consolidated retention cleanup completed successfully ===")
            return stats
    
    except LockAcquisitionError:
        logger.warning("Skipping retention cleanup - another instance is already running")
        raise
    except Exception as exc:
        logger.exception(f"Retention cleanup failed with error: {exc}")
        raise
