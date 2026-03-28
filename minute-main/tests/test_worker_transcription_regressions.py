import importlib
import sys
import types
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

from common.types import TaskType, WorkerMessage


def _fake_ray_module():
    module = types.ModuleType("ray")

    def remote(*args, **kwargs):
        if args and callable(args[0]) and not kwargs:
            return args[0]

        def decorator(obj):
            return obj

        return decorator

    module.remote = remote
    module.get_runtime_context = lambda: types.SimpleNamespace(get_actor_id=lambda: "test-actor")
    return module


@pytest.fixture
def worker_module(monkeypatch, tmp_path):
    monkeypatch.setitem(sys.modules, "ray", _fake_ray_module())
    monkeypatch.setitem(
        sys.modules,
        "worker.healthcheck",
        types.SimpleNamespace(HEARTBEAT_DIR=Path(tmp_path), HEARTBEAT_TIMEOUT=1200),
    )
    sys.modules.pop("worker.ray_recieve_service", None)
    module = importlib.import_module("worker.ray_recieve_service")
    return importlib.reload(module)


def _stopped_flag(*values: bool):
    return types.SimpleNamespace(get=types.SimpleNamespace(remote=AsyncMock(side_effect=list(values))))


@pytest.mark.asyncio
async def test_transcription_retry_exhaustion_deadletters_without_completion(worker_module, monkeypatch):
    message = WorkerMessage(id=uuid.uuid4(), type=TaskType.TRANSCRIPTION, data=None)
    receipt_handle = "receipt-handle"
    transcription_queue = MagicMock()
    transcription_queue.receive_message.return_value = [(message, receipt_handle)]
    llm_queue = MagicMock()

    service = worker_module.RayTranscriptionService(
        transcription_queue_service=transcription_queue,
        llm_queue_service=llm_queue,
        stopped=_stopped_flag(False, True),
    )

    service._process_transcription_with_retry = AsyncMock(
        side_effect=worker_module.RetryExhaustedError(2, Exception("persistent failure"))
    )

    monkeypatch.setattr(worker_module.settings, "ENABLE_JOB_DEDUPLICATION", False, raising=False)

    await service.process()

    transcription_queue.deadletter_message.assert_called_once_with(message, receipt_handle)
    transcription_queue.complete_message.assert_not_called()
    transcription_queue.publish_message.assert_not_called()


@pytest.mark.asyncio
async def test_transcription_retry_exhaustion_clears_idempotency_without_requeue(worker_module, monkeypatch):
    message = WorkerMessage(id=uuid.uuid4(), type=TaskType.TRANSCRIPTION, data=None)
    receipt_handle = "receipt-handle"
    transcription_queue = MagicMock()
    transcription_queue.receive_message.return_value = [(message, receipt_handle)]
    llm_queue = MagicMock()
    fake_idempotency = MagicMock()
    fake_idempotency.is_already_processing.return_value = False

    service = worker_module.RayTranscriptionService(
        transcription_queue_service=transcription_queue,
        llm_queue_service=llm_queue,
        stopped=_stopped_flag(False, True),
    )

    service._process_transcription_with_retry = AsyncMock(
        side_effect=worker_module.RetryExhaustedError(3, Exception("persistent failure"))
    )

    monkeypatch.setattr(worker_module, "idempotency_service", fake_idempotency)
    monkeypatch.setattr(worker_module.settings, "ENABLE_JOB_DEDUPLICATION", True, raising=False)

    await service.process()

    fake_idempotency.clear_job.assert_called_once_with("transcription", message.id)
    transcription_queue.deadletter_message.assert_called_once_with(message, receipt_handle)
    transcription_queue.complete_message.assert_not_called()
    transcription_queue.publish_message.assert_not_called()
