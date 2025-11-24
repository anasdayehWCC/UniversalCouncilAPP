"""Helpers for Azure/STT lexicon and phrase list configuration."""

from __future__ import annotations

from typing import Iterable

from common.settings import get_settings


settings = get_settings()


def _dedupe(values: Iterable[str]) -> list[str]:
    seen: dict[str, None] = {}
    for value in values:
        value = value.strip()
        if not value:
            continue
        seen.setdefault(value, None)
    return list(seen.keys())


def build_phrase_list(service_domain_id: str | None) -> dict | None:
    """Return Azure phraseList payload including optional bias weight.

    Domain-specific phrases (if provided via env) are merged with the global list and de-duplicated.
    """

    phrases: list[str] = []
    if settings.AZURE_SPEECH_PHRASE_LIST:
        phrases.extend(settings.AZURE_SPEECH_PHRASE_LIST)

    if service_domain_id:
        domain_key = str(service_domain_id)
        domain_phrases = settings.AZURE_SPEECH_PHRASE_LIST_BY_DOMAIN.get(domain_key, [])
        phrases.extend(domain_phrases)

    phrases = _dedupe(phrases)
    if not phrases:
        return None

    return {"phrases": phrases, "biasingWeight": settings.AZURE_SPEECH_PHRASE_LIST_BIAS}
