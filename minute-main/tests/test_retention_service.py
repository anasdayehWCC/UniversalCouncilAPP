"""
Tests for retention cleanup service with locking and retry logic.

Tests cover:
1. Advisory lock acquisition and release
2. Storage deletion retry logic with exponential backoff
3. Recording deletion: blob BEFORE database
4. Orphaned record handling when storage fails
5. Integration with retention policies
"""

import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from zoneinfo import ZoneInfo

import pytest
from azure.core.exceptions import ResourceNotFoundError, ServiceRequestError
from sqlmodel import Session

from common.database.postgres_models import (
    JobStatus,
    Recording,
    RetentionPolicy,
    Transcription,
)
from common.services.retention_service import (
    RETENTION_CLEANUP_LOCK_ID,
    LockAcquisitionError,
    StorageDeletionError,
    advisory_lock,
    cleanup_recording_with_storage,
    delete_blob_with_retry,
    run_consolidated_retention_cleanup,
)


@pytest.fixture
def mock_session():
    """Mock database session."""
    session = MagicMock(spec=Session)
    session.exec = MagicMock()
    session.commit = MagicMock()
    session.delete = MagicMock()
    return session


@pytest.fixture
def mock_storage_service():
    """Mock storage service with delete method."""
    service = MagicMock()
    service.delete = AsyncMock()
    return service


@pytest.fixture
def sample_recording():
    """Sample recording with s3 file key."""
    return Recording(
        id="rec-123",
        s3_file_key="recordings/2025/rec-123.wav",
        created_datetime=datetime.now(tz=ZoneInfo("Europe/London")) - timedelta(days=30),
    )


class TestAdvisoryLock:
    """Test PostgreSQL advisory lock acquisition and release."""
    
    @pytest.mark.asyncio
    async def test_lock_acquisition_success(self, mock_session):
        """Test successful lock acquisition and release."""
        # Mock successful lock acquisition
        mock_result_acquired = MagicMock()
        mock_result_acquired.scalar.return_value = True
        mock_result_released = MagicMock()
        mock_result_released.scalar.return_value = True
        
        mock_session.execute.side_effect = [
            mock_result_acquired,  # pg_try_advisory_lock returns True
            mock_result_released,  # pg_advisory_unlock returns True
        ]
        
        async with advisory_lock(mock_session, RETENTION_CLEANUP_LOCK_ID, 300):
            # Inside critical section
            pass
        
        # Verify lock was acquired and released (2 execute calls)
        assert mock_session.execute.call_count == 2
    
    @pytest.mark.asyncio
    async def test_lock_acquisition_failure(self, mock_session):
        """Test lock acquisition failure when another instance is running."""
        # Mock failed lock acquisition
        mock_result = MagicMock()
        mock_result.scalar.return_value = False
        mock_session.execute.return_value = mock_result
        
        with pytest.raises(LockAcquisitionError, match="another cleanup job is running"):
            async with advisory_lock(mock_session, RETENTION_CLEANUP_LOCK_ID, 300):
                pass
        
        # Verify unlock was NOT called since lock was never acquired
        assert mock_session.execute.call_count == 1
    
    @pytest.mark.asyncio
    async def test_lock_released_on_exception(self, mock_session):
        """Test lock is released even when exception occurs in critical section."""
        mock_result_acquired = MagicMock()
        mock_result_acquired.scalar.return_value = True
        mock_result_released = MagicMock()
        mock_result_released.scalar.return_value = True
        
        mock_session.execute.side_effect = [
            mock_result_acquired,  # Lock acquired
            mock_result_released,  # Unlock called
        ]
        
        with pytest.raises(ValueError):
            async with advisory_lock(mock_session, RETENTION_CLEANUP_LOCK_ID, 300):
                raise ValueError("Simulated error")
        
        # Verify unlock was called despite exception
        assert mock_session.execute.call_count == 2


class TestBlobDeletionWithRetry:
    """Test storage blob deletion with retry logic."""
    
    @pytest.mark.asyncio
    async def test_blob_deletion_success(self, mock_storage_service):
        """Test successful blob deletion on first attempt."""
        mock_storage_service.delete.return_value = None
        
        success, error = await delete_blob_with_retry(mock_storage_service, "test-key")
        
        assert success is True
        assert error is None
        mock_storage_service.delete.assert_called_once_with("test-key")
    
    @pytest.mark.asyncio
    async def test_blob_already_deleted(self, mock_storage_service):
        """Test handling of already-deleted blob (ResourceNotFoundError)."""
        mock_storage_service.delete.side_effect = ResourceNotFoundError("Not found")
        
        success, error = await delete_blob_with_retry(mock_storage_service, "test-key")
        
        assert success is True
        assert error is None
    
    @pytest.mark.asyncio
    async def test_blob_deletion_transient_error_then_success(self, mock_storage_service):
        """Test retry on transient error (429, 503) then success."""
        # Fail twice with 429, then succeed
        mock_storage_service.delete.side_effect = [
            ServiceRequestError("429 Too Many Requests"),
            ServiceRequestError("503 Service Unavailable"),
            None,  # Success on 3rd attempt
        ]
        
        success, error = await delete_blob_with_retry(mock_storage_service, "test-key")
        
        assert success is True
        assert error is None
        assert mock_storage_service.delete.call_count == 3
    
    @pytest.mark.asyncio
    async def test_blob_deletion_permanent_error(self, mock_storage_service):
        """Test permanent error (403, non-transient) fails without retry."""
        # Permanent error should not retry
        mock_storage_service.delete.side_effect = PermissionError("403 Forbidden")
        
        success, error = await delete_blob_with_retry(mock_storage_service, "test-key")
        
        assert success is False
        assert "Permanent error" in error
        assert "403" in error or "Forbidden" in error
        mock_storage_service.delete.assert_called_once()
    
    @pytest.mark.asyncio
    @patch("common.services.retention_service.settings")
    async def test_blob_deletion_exhausted_retries(self, mock_settings, mock_storage_service):
        """Test all retries exhausted on transient errors."""
        mock_settings.STORAGE_DELETE_MAX_RETRIES = 3
        mock_settings.STORAGE_DELETE_RETRY_BASE_SECONDS = 0.1
        
        # Always fail with transient error
        mock_storage_service.delete.side_effect = ServiceRequestError("500 Internal Server Error")
        
        success, error = await delete_blob_with_retry(mock_storage_service, "test-key")
        
        assert success is False
        assert "after 3 retries" in error
        assert mock_storage_service.delete.call_count == 3


class TestRecordingCleanupWithStorage:
    """Test recording deletion: blob FIRST, then database."""
    
    @pytest.mark.asyncio
    async def test_recording_deleted_when_blob_succeeds(
        self, mock_session, mock_storage_service, sample_recording
    ):
        """Test database record deleted only when blob deletion succeeds."""
        mock_storage_service.delete.return_value = None
        
        success, error = await cleanup_recording_with_storage(
            mock_session, sample_recording, mock_storage_service, []
        )
        
        assert success is True
        assert error is None
        mock_storage_service.delete.assert_called_once_with(sample_recording.s3_file_key)
        mock_session.delete.assert_called_once_with(sample_recording)
    
    @pytest.mark.asyncio
    async def test_recording_retained_when_blob_fails(
        self, mock_session, mock_storage_service, sample_recording
    ):
        """
        **CRITICAL TEST**: Database record NOT deleted when blob deletion fails.
        
        This is the core fix - prevents orphaned blobs consuming storage.
        """
        # Simulate blob deletion failure
        mock_storage_service.delete.side_effect = PermissionError("403 Forbidden")
        
        success, error = await cleanup_recording_with_storage(
            mock_session, sample_recording, mock_storage_service, []
        )
        
        assert success is False
        assert error is not None
        assert "Permanent error" in error
        
        # CRITICAL: Database record should NOT be deleted
        mock_session.delete.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_recording_without_blob_deleted_immediately(
        self, mock_session, mock_storage_service
    ):
        """Test recording without blob (s3_file_key=None) deleted immediately."""
        recording = Recording(
            id="rec-no-blob",
            s3_file_key=None,  # No blob
            created_datetime=datetime.now(tz=ZoneInfo("Europe/London")),
        )
        
        success, error = await cleanup_recording_with_storage(
            mock_session, recording, mock_storage_service, []
        )
        
        assert success is True
        assert error is None
        mock_storage_service.delete.assert_not_called()
        mock_session.delete.assert_called_once_with(recording)


class TestConsolidatedRetentionCleanup:
    """Integration tests for consolidated retention cleanup."""
    
    @pytest.mark.asyncio
    @patch("common.services.retention_service.get_storage_service")
    @patch("common.services.retention_service.advisory_lock")
    async def test_cleanup_runs_with_lock(
        self, mock_advisory_lock, mock_get_storage, mock_session
    ):
        """Test cleanup runs inside advisory lock."""
        # Mock lock context manager
        mock_advisory_lock.return_value.__aenter__ = AsyncMock()
        mock_advisory_lock.return_value.__aexit__ = AsyncMock()
        
        # Mock empty database
        mock_session.exec.return_value.all.return_value = []
        
        with patch("common.services.retention_service.cleanup_failed_records"):
            await run_consolidated_retention_cleanup(mock_session)
        
        # Verify lock was used
        mock_advisory_lock.assert_called_once()
    
    @pytest.mark.asyncio
    @patch("common.services.retention_service.advisory_lock")
    async def test_cleanup_skipped_when_lock_unavailable(
        self, mock_advisory_lock, mock_session
    ):
        """Test cleanup is skipped when lock cannot be acquired."""
        # Simulate lock acquisition failure
        mock_advisory_lock.side_effect = LockAcquisitionError("Lock unavailable")
        
        with pytest.raises(LockAcquisitionError):
            await run_consolidated_retention_cleanup(mock_session)
    
    @pytest.mark.asyncio
    @patch("common.services.retention_service.get_storage_service")
    @patch("common.services.retention_service.advisory_lock")
    async def test_cleanup_policy_based_deletion(
        self, mock_advisory_lock, mock_get_storage, mock_session
    ):
        """Test retention policy-based cleanup."""
        # Mock lock
        mock_advisory_lock.return_value.__aenter__ = AsyncMock()
        mock_advisory_lock.return_value.__aexit__ = AsyncMock()
        
        # Mock retention policy
        policy = RetentionPolicy(
            id="policy-1",
            organisation_id="org-1",
            audio_retention_days=30,
        )
        
        # Mock old recording
        old_recording = Recording(
            id="rec-old",
            s3_file_key="old-rec.wav",
            organisation_id="org-1",
            created_datetime=datetime.now(tz=ZoneInfo("Europe/London")) - timedelta(days=35),
        )
        
        # Setup mock returns
        mock_session.exec.return_value.all.side_effect = [
            [policy],  # Policies query
            [old_recording],  # Recordings query
            [],  # Users query
            [],  # Orphaned recordings query
        ]
        
        mock_storage = AsyncMock()
        mock_storage.delete.return_value = None
        mock_get_storage.return_value = mock_storage
        
        with patch("common.services.retention_service.cleanup_failed_records"):
            stats = await run_consolidated_retention_cleanup(mock_session)
        
        # Verify recording was processed
        assert stats["recordings_deleted"] == 1
        mock_storage.delete.assert_called_with("old-rec.wav")
        mock_session.delete.assert_called_with(old_recording)


@pytest.mark.asyncio
class TestRetryBackoffTiming:
    """Test exponential backoff timing for retries."""
    
    @pytest.mark.asyncio
    @patch("common.services.retention_service.settings")
    async def test_exponential_backoff_delays(self, mock_settings, mock_storage_service):
        """Test retry delays follow exponential backoff pattern."""
        mock_settings.STORAGE_DELETE_MAX_RETRIES = 3
        mock_settings.STORAGE_DELETE_RETRY_BASE_SECONDS = 1.0
        
        # Track call timestamps
        call_times = []
        
        async def track_delete(key):
            call_times.append(asyncio.get_event_loop().time())
            raise ServiceRequestError("Transient error")
        
        mock_storage_service.delete = track_delete
        
        success, error = await delete_blob_with_retry(mock_storage_service, "test-key")
        
        assert success is False
        assert len(call_times) == 3
        
        # Verify exponential backoff (approximately 1s, 2s, 4s)
        if len(call_times) >= 2:
            delay1 = call_times[1] - call_times[0]
            assert 0.5 < delay1 < 2.5  # ~1s with jitter
        
        if len(call_times) >= 3:
            delay2 = call_times[2] - call_times[1]
            assert 1.5 < delay2 < 4.5  # ~2s with jitter
