from datetime import datetime, timezone
import uuid

from common.database.postgres_models import JobStatus
from common.services.translation_handler_service import TranslationHandlerService


def test_serialize_translations_handles_none():
    assert TranslationHandlerService.serialize_translations(None) == []


def test_serialize_translations_parses_entries():
    now = datetime.now(timezone.utc).isoformat()
    user_id = uuid.uuid4()
    payload = {
        "es": {
            "language": "es",
            "status": JobStatus.COMPLETED.name,
            "text": "Hola",
            "updated_at": now,
            "error": None,
            "requested_by": str(user_id),
            "auto_requested": True,
        }
    }

    entries = TranslationHandlerService.serialize_translations(payload)

    assert len(entries) == 1
    entry = entries[0]
    assert entry.language == "es"
    assert entry.status == JobStatus.COMPLETED
    assert entry.text == "Hola"
    assert entry.requested_by == user_id
    assert entry.auto_requested is True
