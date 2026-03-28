import asyncio
import logging
from typing import Any, List

import ray

from common.config.loader import load_tenant_config
from common.services.exceptions import InteractionFailedError, TranscriptionFailedError
from common.services.export_handler_service import ExportHandlerService
from common.services.idempotency_service import get_idempotency_service
from common.services.minute_handler_service import MinuteGenerationFailedError, MinuteHandlerService
from common.services.queue_services.base import QueueService
from common.services.retry_utils import RetryExhaustedError, async_retry_with_backoff
from common.services.translation_handler_service import TranslationHandlerService
from common.services.transcription_handler_service import TranscriptionHandlerService
from common.settings import get_settings
from common.types import TaskType, TranslationJobData, WorkerMessage
from common.tracing import set_trace_id
from worker.healthcheck import HEARTBEAT_DIR

logger = logging.getLogger(__name__)
ray_logger = logging.getLogger("ray")
ray_logger.setLevel(logging.WARNING)
settings = get_settings()
idempotency_service = get_idempotency_service()


def _auto_translation_languages() -> List[str]:
    try:
        tenant_config = load_tenant_config(settings.TENANT_CONFIG_ID)
    except Exception:
        logger.exception("Unable to load tenant config for translation targets")
        return []

    languages_cfg = getattr(tenant_config, "languages", None)
    if not languages_cfg or not getattr(languages_cfg, "autoTranslate", False):
        return []

    default_lang = (languages_cfg.default or "en").split("-")[0].lower()
    targets: List[str] = []
    for candidate in languages_cfg.available:
        if not candidate:
            continue
        if candidate.lower() == default_lang:
            continue
        targets.append(candidate)
    return targets


@ray.remote
class HasBeenStopped:
    def __init__(self):
        self.stopped = False

    def get(self):
        return self.stopped

    def set(self):
        self.stopped = True


# restart indefinitely, try each task only once
@ray.remote(max_restarts=-1, max_task_retries=0)
class RayTranscriptionService:
    def __init__(
        self, transcription_queue_service: QueueService, llm_queue_service: QueueService, stopped: HasBeenStopped
    ) -> None:
        self.stopped = stopped
        self.transcription_queue_service = transcription_queue_service
        self.llm_queue_service = llm_queue_service
        actor_id = ray.get_runtime_context().get_actor_id()
        self.heartbeat_path = HEARTBEAT_DIR / f"worker_{actor_id}.heartbeat"
        self.heartbeat_path.touch()
        logger.info("Ray Transcription receive service initialised")

    async def process(self) -> None:
        while not await self.stopped.get.remote():
            logger.info("Receiving transcription messages")
            messages = self.transcription_queue_service.receive_message(max_messages=1)
            for message, receipt_handle in messages:
                if settings.ENABLE_JOB_DEDUPLICATION and idempotency_service.is_already_processing(
                    "transcription", message.id
                ):
                    logger.info("Transcription %s is already being processed. Skipping.", message.id)
                    self.transcription_queue_service.complete_message(receipt_handle)
                    continue

                try:
                    logger.info("Received minute id for transcription: %s", message.id)
                    preferred_adapter = None
                    if message.data and message.data.processing_mode == "economy":
                        preferred_adapter = "azure_stt_batch"

                    transcription_job = await self._process_transcription_with_retry(
                        message.id, message.data, preferred_adapter
                    )
                except RetryExhaustedError as exc:
                    logger.error(
                        "Transcription %s failed after %d attempts. Sending to DLQ.", message.id, exc.attempts
                    )
                    if settings.ENABLE_JOB_DEDUPLICATION:
                        idempotency_service.clear_job("transcription", message.id)
                    self.transcription_queue_service.deadletter_message(message, receipt_handle)
                    continue
                else:
                    # sync jobs should have the transcript available immediately, async jobs may need to go on the queue
                    if transcription_job.transcript:
                        logger.info("Transcription complete for minute id %s complete", message.id)
                        minute_version = await MinuteHandlerService.get_only_minute_version_for_minute_id(message.id)
                        self.llm_queue_service.publish_message(
                            WorkerMessage(id=minute_version.id, type=TaskType.MINUTE)
                        )
                        self._auto_request_translations(message.id)
                        if settings.ENABLE_JOB_DEDUPLICATION:
                            idempotency_service.mark_completed("transcription", message.id)
                    else:
                        logger.info("Async transcription job not ready yet. Re-queueing minute id: %s", message.id)
                        if settings.ENABLE_JOB_DEDUPLICATION:
                            idempotency_service.clear_job("transcription", message.id)
                        self.transcription_queue_service.publish_message(
                            WorkerMessage(
                                id=message.id,
                                type=TaskType.TRANSCRIPTION,
                                data=transcription_job,
                                trace_id=message.trace_id,
                            )
                        )

                self.transcription_queue_service.complete_message(receipt_handle)

            self.heartbeat_path.touch()

    @async_retry_with_backoff(
        max_retries=settings.MAX_RETRIES,
        backoff_base=settings.BACKOFF_BASE,
        max_delay=settings.MAX_BACKOFF_DELAY,
        exceptions=(TranscriptionFailedError, Exception),
    )
    async def _process_transcription_with_retry(self, minute_id, data, preferred_adapter):
        """Process transcription with automatic retry logic."""
        return await TranscriptionHandlerService.process_transcription(
            minute_id, data, preferred_adapter=preferred_adapter
        )

    def _auto_request_translations(self, minute_id):
        languages = _auto_translation_languages()
        if not languages:
            return
        try:
            transcription = TranscriptionHandlerService.get_transcription_from_minute_id(minute_id)
        except Exception:
            logger.exception("Unable to fetch transcription for auto translation %s", minute_id)
            return
        try:
            TranslationHandlerService.request_translations(
                queue_service=self.llm_queue_service,
                transcription_id=transcription.id,
                languages=languages,
                requested_by=transcription.user_id,
                auto_requested=True,
            )
        except Exception:
            logger.exception("Failed to queue translations for transcription %s", transcription.id)


@ray.remote(max_restarts=-1, max_task_retries=0)
class RayLlmService:
    def __init__(self, queue_service: QueueService, stopped: HasBeenStopped) -> None:
        self.stopped = stopped
        self.queue_service = queue_service
        actor_id = ray.get_runtime_context().get_actor_id()
        self.heartbeat_path = HEARTBEAT_DIR / f"worker_{actor_id}.heartbeat"
        self.heartbeat_path.touch()
        logger.info("Ray LLM receive service initialised")

    async def process(self) -> None:
        logger.info("receiving LLM messages from Ray queue")
        while not await self.stopped.get.remote():
            logger.info("Receiving LLM messages")
            messages = self.queue_service.receive_message(max_messages=10)
            tasks: list[asyncio.Task] = []
            for message, receipt_handle in messages:
                set_trace_id(message.trace_id)
                match message.type:
                    case TaskType.MINUTE:
                        tasks.append(asyncio.create_task(self.process_minute_task(message, receipt_handle)))
                    case TaskType.EDIT:
                        tasks.append(asyncio.create_task(self.process_edit_task(message, receipt_handle)))
                    case TaskType.INTERACTIVE:
                        tasks.append(asyncio.create_task(self.process_interactive_task(message, receipt_handle)))
                    case TaskType.EXPORT:
                        tasks.append(asyncio.create_task(self.process_export_task(message, receipt_handle)))
                    case TaskType.TRANSLATION:
                        tasks.append(asyncio.create_task(self.process_translation_task(message, receipt_handle)))
                    case _:
                        logger.warning("Unknown task type: %s", message.type)
                        self.queue_service.deadletter_message(message, receipt_handle)
            if len(tasks) > 0:
                done, pending = await asyncio.wait(tasks)
                for task in done:
                    try:
                        task.result()
                    except Exception:
                        logger.exception("Unhandled error in LLM actor")

            self.heartbeat_path.touch()

    async def process_minute_task(self, message: WorkerMessage, receipt_handle: Any) -> None:
        if settings.ENABLE_JOB_DEDUPLICATION and idempotency_service.is_already_processing(
            "minute_generation", message.id
        ):
            logger.info("Minute generation %s is already being processed. Skipping.", message.id)
            self.queue_service.complete_message(receipt_handle)
            return

        try:
            logger.info("Received minute generation message for MinuteVersion id %s", message.id)
            await self._process_minute_with_retry(message.id)
            logger.info("Minute generation complete for MinuteVersion id %s", message.id)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.mark_completed("minute_generation", message.id)
        except RetryExhaustedError as exc:
            logger.error(
                "Minute generation %s failed after %d attempts. Sending to DLQ.", message.id, exc.attempts
            )
            self.queue_service.deadletter_message(message, receipt_handle)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.clear_job("minute_generation", message.id)
        except MinuteGenerationFailedError:
            logger.exception("Minute generation for MinuteVersion id %s failed", message.id)
            self.queue_service.complete_message(receipt_handle)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.clear_job("minute_generation", message.id)
        else:
            self.queue_service.complete_message(receipt_handle)

    @async_retry_with_backoff(
        max_retries=settings.MAX_RETRIES,
        backoff_base=settings.BACKOFF_BASE,
        max_delay=settings.MAX_BACKOFF_DELAY,
        exceptions=(MinuteGenerationFailedError, Exception),
    )
    async def _process_minute_with_retry(self, minute_version_id):
        """Process minute generation with automatic retry logic."""
        await MinuteHandlerService.process_minute_generation_message(minute_version_id)

    async def process_edit_task(self, message: WorkerMessage, receipt_handle: Any) -> None:
        job_key = f"{message.id}:{message.data.source_id if message.data else 'unknown'}"
        if settings.ENABLE_JOB_DEDUPLICATION and idempotency_service.is_already_processing(
            "minute_edit", message.id, extra=job_key
        ):
            logger.info("Minute edit %s is already being processed. Skipping.", message.id)
            self.queue_service.complete_message(receipt_handle)
            return

        try:
            logger.info("Received minute edit message for minute id %s", message.id)
            await self._process_edit_with_retry(message.id, message.data.source_id if message.data else None)
            logger.info("Minute edit complete for MinuteVersion id %s", message.id)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.mark_completed("minute_edit", message.id, extra=job_key)
        except RetryExhaustedError as exc:
            logger.error("Minute edit %s failed after %d attempts. Sending to DLQ.", message.id, exc.attempts)
            self.queue_service.deadletter_message(message, receipt_handle)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.clear_job("minute_edit", message.id, extra=job_key)
        except MinuteGenerationFailedError:
            logger.exception("Minute edit for MinuteVersion id %s failed", message.id)
            self.queue_service.complete_message(receipt_handle=receipt_handle)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.clear_job("minute_edit", message.id, extra=job_key)
        else:
            self.queue_service.complete_message(receipt_handle=receipt_handle)

    @async_retry_with_backoff(
        max_retries=settings.MAX_RETRIES,
        backoff_base=settings.BACKOFF_BASE,
        max_delay=settings.MAX_BACKOFF_DELAY,
        exceptions=(MinuteGenerationFailedError, Exception),
    )
    async def _process_edit_with_retry(self, target_minute_version_id, source_minute_version_id):
        """Process minute edit with automatic retry logic."""
        await MinuteHandlerService.process_minute_edit_message(
            target_minute_version_id=target_minute_version_id, source_minute_version_id=source_minute_version_id
        )
        await ExportHandlerService.export_minute_version(target_minute_version_id)

    async def process_export_task(self, message: WorkerMessage, receipt_handle: Any) -> None:
        if settings.ENABLE_JOB_DEDUPLICATION and idempotency_service.is_already_processing("export", message.id):
            logger.info("Export %s is already being processed. Skipping.", message.id)
            self.queue_service.complete_message(receipt_handle)
            return

        try:
            logger.info("Received export message for minute version id %s", message.id)
            await self._process_export_with_retry(message.id)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.mark_completed("export", message.id)
        except RetryExhaustedError as exc:
            logger.error("Export %s failed after %d attempts. Sending to DLQ.", message.id, exc.attempts)
            self.queue_service.deadletter_message(message, receipt_handle)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.clear_job("export", message.id)
        except Exception:  # noqa: BLE001
            logger.exception("Export failed for minute version %s", message.id)
            self.queue_service.complete_message(receipt_handle=receipt_handle)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.clear_job("export", message.id)
        else:
            self.queue_service.complete_message(receipt_handle=receipt_handle)

    @async_retry_with_backoff(
        max_retries=settings.MAX_RETRIES,
        backoff_base=settings.BACKOFF_BASE,
        max_delay=settings.MAX_BACKOFF_DELAY,
        exceptions=(Exception,),
    )
    async def _process_export_with_retry(self, minute_version_id):
        """Process export with automatic retry logic."""
        await ExportHandlerService.export_minute_version(minute_version_id)

    async def process_interactive_task(self, message: WorkerMessage, receipt_handle: Any) -> None:
        if settings.ENABLE_JOB_DEDUPLICATION and idempotency_service.is_already_processing("interaction", message.id):
            logger.info("Interaction %s is already being processed. Skipping.", message.id)
            self.queue_service.complete_message(receipt_handle)
            return

        try:
            logger.info("Received interactive mode message for chat id %s", message.id)
            await self._process_interactive_with_retry(message.id)
            logger.info("Interaction complete for chat id %s", message.id)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.mark_completed("interaction", message.id)
        except RetryExhaustedError as exc:
            logger.error("Interaction %s failed after %d attempts. Sending to DLQ.", message.id, exc.attempts)
            self.queue_service.deadletter_message(message, receipt_handle)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.clear_job("interaction", message.id)
        except InteractionFailedError:
            logger.exception("Interaction for chat id %s failed", message.id)
            self.queue_service.complete_message(receipt_handle=receipt_handle)
            if settings.ENABLE_JOB_DEDUPLICATION:
                idempotency_service.clear_job("interaction", message.id)
        else:
            self.queue_service.complete_message(receipt_handle=receipt_handle)

    @async_retry_with_backoff(
        max_retries=settings.MAX_RETRIES,
        backoff_base=settings.BACKOFF_BASE,
        max_delay=settings.MAX_BACKOFF_DELAY,
        exceptions=(InteractionFailedError, Exception),
    )
    async def _process_interactive_with_retry(self, chat_id):
        """Process interactive chat with automatic retry logic."""
        await TranscriptionHandlerService.process_interactive_message(chat_id)

    async def process_translation_task(self, message: WorkerMessage, receipt_handle: Any) -> None:
        """Process translation jobs.

        NOTE: Translation jobs are NOT sent to DLQ per AGENTS.md rule.
        They are retried with backoff and then completed to prevent blocking the queue.
        """
        try:
            if not message.data or not isinstance(message.data, TranslationJobData):
                raise ValueError("Translation task missing payload")
            logger.info(
                "Received translation message for transcription %s (%s)",
                message.data.transcription_id,
                message.data.language,
            )
            await self._process_translation_with_retry(message.data)
        except RetryExhaustedError as exc:
            logger.error(
                "Translation job for transcription %s failed after %d attempts. Completing message (no DLQ).",
                getattr(message.data, "transcription_id", message.id),
                exc.attempts,
            )
            self.queue_service.complete_message(receipt_handle)
        except Exception:
            logger.exception(
                "Translation job failed for transcription %s", getattr(message.data, "transcription_id", message.id)
            )
            self.queue_service.complete_message(receipt_handle)
        else:
            self.queue_service.complete_message(receipt_handle)

    @async_retry_with_backoff(
        max_retries=settings.MAX_RETRIES,
        backoff_base=settings.BACKOFF_BASE,
        max_delay=settings.MAX_BACKOFF_DELAY,
        exceptions=(Exception,),
    )
    async def _process_translation_with_retry(self, translation_data):
        """Process translation with automatic retry logic."""
        await TranslationHandlerService.process_translation_message(translation_data)
