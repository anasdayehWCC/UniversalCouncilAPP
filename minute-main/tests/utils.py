import os
from contextlib import asynccontextmanager
from enum import StrEnum, auto

from bs4 import BeautifulSoup
from httpx import ASGITransport, AsyncClient

# Ensure tests do not attempt to reach external queues/services
os.environ.setdefault("QUEUE_SERVICE_NAME", "noop")
os.environ.setdefault("TRANSCRIPTION_QUEUE_NAME", "noop-transcription")
os.environ.setdefault("TRANSCRIPTION_DEADLETTER_QUEUE_NAME", "noop-transcription-deadletter")
os.environ.setdefault("LLM_QUEUE_NAME", "noop-llm")
os.environ.setdefault("LLM_DEADLETTER_QUEUE_NAME", "noop-llm-deadletter")
os.environ["SENTRY_DSN"] = ""

from backend.main import app


@asynccontextmanager
async def get_test_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class FileTypeTests(StrEnum):
    NORMAL = auto()
    ZERO_BYTES = auto()
    CORRUPTED = auto()


def get_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html, features="html.parser")
    for script in soup(["script", "style"]):
        script.extract()
    return soup.get_text()
