"""Integration tests for DLQ routing and retry behavior."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from common.services.exceptions import InteractionFailedError, TranscriptionFailedError
from common.services.minute_handler_service import MinuteGenerationFailedError
from common.services.retry_utils import RetryExhaustedError
from common.types import TaskType, WorkerMessage
from worker.ray_recieve_service import RayLlmService, RayTranscriptionService


class TestDLQRouting:
    """Test DLQ routing for failed jobs."""

    @pytest.fixture
    def mock_queue_service(self):
        """Mock queue service."""
        service = MagicMock()
        service.receive_message.return_value = []
        service.publish_message = MagicMock()
        service.complete_message = MagicMock()
        service.deadletter_message = MagicMock()
        return service

    @pytest.fixture
    def mock_stopped(self):
        """Mock stopped flag."""
        stopped = MagicMock()
        stopped.get = AsyncMock(return_value=True)  # Stop immediately after first iteration
        return stopped

    @pytest.mark.asyncio
    async def test_transcription_failure_sends_to_dlq(self, mock_queue_service, mock_stopped):
        """Test that transcription failures after max retries send to DLQ."""
        message = WorkerMessage(id=uuid.uuid4(), type=TaskType.TRANSCRIPTION, data=None)
        receipt_handle = "test-receipt-handle"

        mock_queue_service.receive_message.return_value = [(message, receipt_handle)]

        service = RayTranscriptionService(
            transcription_queue_service=mock_queue_service,
            llm_queue_service=mock_queue_service,
            stopped=mock_stopped,
        )

        with patch(
            "worker.ray_recieve_service.TranscriptionHandlerService.process_transcription",
            side_effect=TranscriptionFailedError("persistent failure"),
        ):
            # Patch settings for fast test
            with patch("worker.ray_recieve_service.settings") as mock_settings:
                mock_settings.MAX_RETRIES = 1
                mock_settings.BACKOFF_BASE = 0.01
                mock_settings.MAX_BACKOFF_DELAY = 1.0
                mock_settings.ENABLE_JOB_DEDUPLICATION = False

                await service.process()

        # Should have sent to DLQ
        mock_queue_service.deadletter_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_minute_generation_failure_sends_to_dlq(self, mock_queue_service, mock_stopped):
        """Test that minute generation failures after max retries send to DLQ."""
        message = WorkerMessage(id=uuid.uuid4(), type=TaskType.MINUTE)
        receipt_handle = "test-receipt-handle"

        llm_service = RayLlmService(queue_service=mock_queue_service, stopped=mock_stopped)

        with patch(
            "worker.ray_recieve_service.MinuteHandlerService.process_minute_generation_message",
            side_effect=MinuteGenerationFailedError("persistent failure"),
        ):
            with patch("worker.ray_recieve_service.settings") as mock_settings:
                mock_settings.MAX_RETRIES = 1
                mock_settings.BACKOFF_BASE = 0.01
                mock_settings.MAX_BACKOFF_DELAY = 1.0
                mock_settings.ENABLE_JOB_DEDUPLICATION = False

                await llm_service.process_minute_task(message, receipt_handle)

        # Should have sent to DLQ
        mock_queue_service.deadletter_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_export_failure_sends_to_dlq(self, mock_queue_service, mock_stopped):
        """Test that export failures after max retries send to DLQ."""
        message = WorkerMessage(id=uuid.uuid4(), type=TaskType.EXPORT)
        receipt_handle = "test-receipt-handle"

        llm_service = RayLlmService(queue_service=mock_queue_service, stopped=mock_stopped)

        with patch(
            "worker.ray_recieve_service.ExportHandlerService.export_minute_version",
            side_effect=Exception("persistent export failure"),
        ):
            with patch("worker.ray_recieve_service.settings") as mock_settings:
                mock_settings.MAX_RETRIES = 1
                mock_settings.BACKOFF_BASE = 0.01
                mock_settings.MAX_BACKOFF_DELAY = 1.0
                mock_settings.ENABLE_JOB_DEDUPLICATION = False

                await llm_service.process_export_task(message, receipt_handle)

        # Should have sent to DLQ
        mock_queue_service.deadletter_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_translation_failure_does_not_send_to_dlq(self, mock_queue_service, mock_stopped):
        """Test that translation failures do NOT send to DLQ (per AGENTS.md rule)."""
        from common.types import TranslationJobData

        translation_data = TranslationJobData(
            transcription_id=uuid.uuid4(), language="es", requested_by=uuid.uuid4(), auto_requested=False
        )
        message = WorkerMessage(id=uuid.uuid4(), type=TaskType.TRANSLATION, data=translation_data)
        receipt_handle = "test-receipt-handle"

        llm_service = RayLlmService(queue_service=mock_queue_service, stopped=mock_stopped)

        with patch(
            "worker.ray_recieve_service.TranslationHandlerService.process_translation_message",
            side_effect=Exception("persistent translation failure"),
        ):
            with patch("worker.ray_recieve_service.settings") as mock_settings:
                mock_settings.MAX_RETRIES = 1
                mock_settings.BACKOFF_BASE = 0.01
                mock_settings.MAX_BACKOFF_DELAY = 1.0
                mock_settings.ENABLE_JOB_DEDUPLICATION = False

                await llm_service.process_translation_task(message, receipt_handle)

        # Should NOT have sent to DLQ
        mock_queue_service.deadletter_message.assert_not_called()

        # Should have completed the message instead
        mock_queue_service.complete_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_interactive_failure_sends_to_dlq(self, mock_queue_service, mock_stopped):
        """Test that interactive chat failures after max retries send to DLQ."""
        message = WorkerMessage(id=uuid.uuid4(), type=TaskType.INTERACTIVE)
        receipt_handle = "test-receipt-handle"

        llm_service = RayLlmService(queue_service=mock_queue_service, stopped=mock_stopped)

        with patch(
            "worker.ray_recieve_service.TranscriptionHandlerService.process_interactive_message",
            side_effect=InteractionFailedError("persistent chat failure"),
        ):
            with patch("worker.ray_recieve_service.settings") as mock_settings:
                mock_settings.MAX_RETRIES = 1
                mock_settings.BACKOFF_BASE = 0.01
                mock_settings.MAX_BACKOFF_DELAY = 1.0
                mock_settings.ENABLE_JOB_DEDUPLICATION = False

                await llm_service.process_interactive_task(message, receipt_handle)

        # Should have sent to DLQ
        mock_queue_service.deadletter_message.assert_called_once()


class TestRetryBehavior:
    """Test retry behavior across job types."""

    @pytest.mark.asyncio
    async def test_successful_retry_completes_message(self):
        """Test that successful retry completes the message."""
        mock_queue_service = MagicMock()
        message = WorkerMessage(id=uuid.uuid4(), type=TaskType.MINUTE)
        receipt_handle = "test-receipt-handle"
        mock_stopped = MagicMock()

        llm_service = RayLlmService(queue_service=mock_queue_service, stopped=mock_stopped)

        # First call fails, second succeeds
        with patch(
            "worker.ray_recieve_service.MinuteHandlerService.process_minute_generation_message",
            side_effect=[MinuteGenerationFailedError("transient failure"), None],
        ):
            with patch("worker.ray_recieve_service.settings") as mock_settings:
                mock_settings.MAX_RETRIES = 2
                mock_settings.BACKOFF_BASE = 0.01
                mock_settings.MAX_BACKOFF_DELAY = 1.0
                mock_settings.ENABLE_JOB_DEDUPLICATION = False

                await llm_service.process_minute_task(message, receipt_handle)

        # Should have completed the message (not deadlettered)
        mock_queue_service.complete_message.assert_called_once_with(receipt_handle)
        mock_queue_service.deadletter_message.assert_not_called()
