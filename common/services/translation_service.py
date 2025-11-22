import logging
from typing import Iterable

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from common.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _normalise_locale(locale: str | None) -> str | None:
    if not locale:
        return None
    return locale.split("-")[0].lower()


class TranslationService:
    def __init__(self) -> None:
        self.api_key = settings.AZURE_TRANSLATOR_KEY
        self.region = settings.AZURE_TRANSLATOR_REGION
        self.endpoint = (
            settings.AZURE_TRANSLATOR_ENDPOINT
            or (f"https://{self.region}.api.cognitive.microsofttranslator.com" if self.region else None)
        )
        if self.endpoint:
            self.endpoint = self.endpoint.rstrip("/") + "/translate"
        if not self.api_key or not self.region or not self.endpoint:
            logger.warning("Azure Translator credentials missing - translations will return source text")

    async def translate_dialogue(
        self, entries: Iterable[dict], target_language: str, source_locale: str | None
    ) -> str:
        source_lang = _normalise_locale(source_locale)
        text = "\n".join(f"{entry.get('speaker', 'Speaker')}: {entry.get('text','')}" for entry in entries)
        if not text.strip():
            return ""
        if not self.api_key or not self.endpoint or not self.region:
            logger.info("Translator not configured; returning original text")
            return text
        return await self._call_translator(text, target_language, source_lang)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        reraise=True,
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TimeoutException)),
    )
    async def _call_translator(self, text: str, target_language: str, source_language: str | None) -> str:
        params = {"api-version": "3.0", "to": target_language}
        if source_language:
            params["from"] = source_language
        headers = {
            "Ocp-Apim-Subscription-Key": self.api_key,
            "Ocp-Apim-Subscription-Region": self.region,
            "Content-Type": "application/json",
        }
        payload = [{"text": text}]
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(self.endpoint, params=params, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            try:
                return data[0]["translations"][0]["text"]
            except (IndexError, KeyError) as exc:  # noqa: PERF203
                raise httpx.HTTPStatusError(
                    "Unexpected translator response payload", request=response.request, response=response
                ) from exc
