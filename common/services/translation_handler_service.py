import logging
from datetime import datetime, timezone
from typing import Iterable
from uuid import UUID

from sqlalchemy.orm import selectinload
from sqlmodel import select

from common.config.loader import load_tenant_config
from common.database.postgres_database import SessionLocal
from common.database.postgres_models import JobStatus, Transcription
from common.services.queue_services.base import QueueService
from common.settings import get_settings
from common.services.translation_service import TranslationService
from common.types import TaskType, TranslationJobData, TranslationStatusEntry, WorkerMessage

logger = logging.getLogger(__name__)
settings = get_settings()
translation_service = TranslationService()


class TranslationHandlerService:
    @staticmethod
    def _normalise_language(language: str) -> str:
        return language.lower()

    @classmethod
    def _update_entry(cls, transcription: Transcription, language: str, **updates) -> dict:
        translations = transcription.translations or {}
        normalised_language = cls._normalise_language(language)
        entry = translations.get(normalised_language, {})
        entry.update(updates)
        entry["language"] = normalised_language
        entry["updated_at"] = datetime.now(timezone.utc).isoformat()
        translations[normalised_language] = entry
        transcription.translations = translations
        return entry

    @classmethod
    async def process_translation_message(cls, message: TranslationJobData) -> None:
        language = cls._normalise_language(message.language)
        with SessionLocal() as session:
            transcription = session.exec(
                select(Transcription)
                .where(Transcription.id == message.transcription_id)
                .options(selectinload(Transcription.recordings))
            ).first()
            if not transcription:
                logger.warning("Transcription %s not found for translation", message.transcription_id)
                return

            cls._update_entry(transcription, language, status=JobStatus.IN_PROGRESS.name)
            session.add(transcription)
            session.commit()

            try:
                tenant_config = load_tenant_config(settings.TENANT_CONFIG_ID)
                source_locale = tenant_config.defaultLocale
                translated_text = await translation_service.translate_dialogue(
                    transcription.dialogue_entries or [], target_language=language, source_locale=source_locale
                )
                cls._update_entry(
                    transcription,
                    language,
                    status=JobStatus.COMPLETED.name,
                    text=translated_text,
                    error=None,
                )
            except Exception as exc:  # noqa: BLE001
                logger.exception("Translation failed for transcription %s", transcription.id)
                cls._update_entry(
                    transcription,
                    language,
                    status=JobStatus.FAILED.name,
                    error=str(exc),
                )
            finally:
                session.add(transcription)
                session.commit()

    @classmethod
    @classmethod
    def enqueue_translation(
        cls,
        transcription_id: UUID,
        language: str,
        requested_by: UUID | None,
        *,
        auto_requested: bool = False,
        force: bool = False,
    ) -> tuple[dict, bool]:
        normalised_language = cls._normalise_language(language)
        with SessionLocal() as session:
            transcription = session.get(Transcription, transcription_id)
            if not transcription:
                msg = "Transcription %s not found when queueing translation"
                raise ValueError(msg % transcription_id)

            translations = transcription.translations or {}
            existing = translations.get(normalised_language)
            if existing and not force:
                status = existing.get("status")
                if status in {
                    JobStatus.AWAITING_START.name,
                    JobStatus.IN_PROGRESS.name,
                }:
                    return existing, False
                if status == JobStatus.COMPLETED.name:
                    return existing, False

            entry = cls._update_entry(
                transcription,
                normalised_language,
                status=JobStatus.AWAITING_START.name,
                text=None,
                error=None,
                requested_by=str(requested_by) if requested_by else None,
                auto_requested=auto_requested,
            )
            session.add(transcription)
            session.commit()
            return entry, True

    @classmethod
    def request_translations(
        cls,
        queue_service: QueueService,
        transcription_id: UUID,
        languages: Iterable[str],
        requested_by: UUID | None,
        *,
        auto_requested: bool = False,
        force: bool = False,
    ) -> list[dict]:
        responses: list[dict] = []
        for language in languages:
            entry, should_queue = cls.enqueue_translation(
                transcription_id=transcription_id,
                language=language,
                requested_by=requested_by,
                auto_requested=auto_requested,
                force=force,
            )
            responses.append(entry)
            if should_queue:
                queue_service.publish_message(
                    WorkerMessage(
                        id=transcription_id,
                        type=TaskType.TRANSLATION,
                        data=TranslationJobData(
                            transcription_id=transcription_id,
                            language=cls._normalise_language(language),
                            requested_by=requested_by,
                            auto=auto_requested,
                        ),
                    )
                )
        return responses

    @staticmethod
    def serialize_translations(translations: dict | None) -> list[TranslationStatusEntry]:
        if not translations:
            return []
        serialised: list[TranslationStatusEntry] = []
        for entry in translations.values():
            language = entry.get("language")
            status_name = entry.get("status", JobStatus.AWAITING_START.name)
            status = JobStatus[status_name] if status_name in JobStatus.__members__ else JobStatus.AWAITING_START
            updated_at = entry.get("updated_at")
            parsed_updated = None
            if isinstance(updated_at, str):
                try:
                    parsed_updated = datetime.fromisoformat(updated_at)
                except ValueError:
                    parsed_updated = None
            requested_by_value = entry.get("requested_by")
            requested_by_uuid = None
            if requested_by_value:
                try:
                    requested_by_uuid = UUID(requested_by_value)
                except ValueError:
                    requested_by_uuid = None
            serialised.append(
                TranslationStatusEntry(
                    language=language,
                    status=status,
                    text=entry.get("text"),
                    updated_at=parsed_updated,
                    error=entry.get("error"),
                    requested_by=requested_by_uuid,
                    auto_requested=bool(entry.get("auto_requested", False)),
                )
            )
        serialised.sort(key=lambda item: item.language or "")
        return serialised
