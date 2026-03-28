"""Unit tests for idempotency service."""

import uuid
from unittest.mock import MagicMock, patch

import pytest

from common.services.idempotency_service import IdempotencyService, get_idempotency_service


class TestIdempotencyService:
    """Test idempotency service."""

    @pytest.fixture
    def service(self):
        """Create a fresh idempotency service for each test."""
        return IdempotencyService()

    def test_make_key_basic(self, service):
        """Test basic key generation."""
        job_id = uuid.uuid4()
        key = service._make_key("transcription", job_id)

        assert key == f"idempotency:transcription:{job_id}"

    def test_make_key_with_extra(self, service):
        """Test key generation with extra data."""
        job_id = uuid.uuid4()
        key = service._make_key("minute_generation", job_id, extra="some_context")

        # Should include a hash of the extra data
        assert key.startswith(f"idempotency:minute_generation:{job_id}:")
        assert len(key) > len(f"idempotency:minute_generation:{job_id}:")

    def test_in_memory_fallback_first_check(self, service):
        """Test in-memory fallback marks job as not processing on first check."""
        job_id = uuid.uuid4()

        is_processing = service.is_already_processing("transcription", job_id)

        assert is_processing is False

    def test_in_memory_fallback_second_check(self, service):
        """Test in-memory fallback marks job as processing on second check."""
        job_id = uuid.uuid4()

        service.is_already_processing("transcription", job_id)
        is_processing = service.is_already_processing("transcription", job_id)

        assert is_processing is True

    def test_mark_completed_in_memory(self, service):
        """Test marking job as completed in memory."""
        job_id = uuid.uuid4()

        service.mark_completed("transcription", job_id)
        is_processing = service.is_already_processing("transcription", job_id)

        # Should be marked as processing (completed jobs stay in set)
        assert is_processing is True

    def test_clear_job_in_memory(self, service):
        """Test clearing job from in-memory tracking."""
        job_id = uuid.uuid4()

        service.is_already_processing("transcription", job_id)
        service.clear_job("transcription", job_id)
        is_processing = service.is_already_processing("transcription", job_id)

        # After clearing, should be treated as new
        assert is_processing is False

    def test_context_manager_success(self, service):
        """Test idempotent_job context manager on success."""
        job_id = uuid.uuid4()

        with service.idempotent_job("transcription", job_id) as should_process:
            assert should_process is True

        # After success, should be marked as completed
        is_processing = service.is_already_processing("transcription", job_id)
        assert is_processing is True

    def test_context_manager_failure_clears_lock(self, service):
        """Test idempotent_job context manager clears lock on failure."""
        job_id = uuid.uuid4()

        with pytest.raises(ValueError):
            with service.idempotent_job("transcription", job_id) as should_process:
                assert should_process is True
                raise ValueError("job failed")

        # After failure, lock should be cleared
        is_processing = service.is_already_processing("transcription", job_id)
        assert is_processing is False

    def test_context_manager_skips_duplicate(self, service):
        """Test idempotent_job context manager skips duplicate jobs."""
        job_id = uuid.uuid4()

        # First attempt
        with service.idempotent_job("transcription", job_id) as should_process:
            assert should_process is True

        # Second attempt should be skipped
        with service.idempotent_job("transcription", job_id) as should_process:
            assert should_process is False

    @patch("common.services.idempotency_service.redis")
    def test_redis_success_path(self, mock_redis_module, service):
        """Test Redis-based idempotency check."""
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        mock_client.set.return_value = True  # Key was set (not exists)
        mock_redis_module.from_url.return_value = mock_client

        with patch.object(service, "_redis_client", None):
            # Force reconnection
            service._get_redis_client()

            job_id = uuid.uuid4()
            is_processing = service.is_already_processing("transcription", job_id)

            assert is_processing is False
            mock_client.set.assert_called_once()

    @patch("common.services.idempotency_service.redis")
    def test_redis_duplicate_detection(self, mock_redis_module, service):
        """Test Redis detects duplicate jobs."""
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        mock_client.set.return_value = False  # Key already exists
        mock_redis_module.from_url.return_value = mock_client

        with patch.object(service, "_redis_client", None):
            service._get_redis_client()

            job_id = uuid.uuid4()
            is_processing = service.is_already_processing("transcription", job_id)

            assert is_processing is True

    @patch("common.services.idempotency_service.redis")
    def test_redis_failure_falls_back_to_memory(self, mock_redis_module, service):
        """Test that Redis failures fall back to in-memory tracking."""
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        mock_client.set.side_effect = Exception("Redis connection error")
        mock_redis_module.from_url.return_value = mock_client

        with patch.object(service, "_redis_client", None):
            service._get_redis_client()

            job_id = uuid.uuid4()

            # Should fall back to in-memory
            is_processing_1 = service.is_already_processing("transcription", job_id)
            is_processing_2 = service.is_already_processing("transcription", job_id)

            assert is_processing_1 is False  # First check
            assert is_processing_2 is True  # Second check (in-memory)


def test_get_idempotency_service_singleton():
    """Test that get_idempotency_service returns a singleton."""
    service1 = get_idempotency_service()
    service2 = get_idempotency_service()

    assert service1 is service2
