import math
from collections import Counter
from dataclasses import dataclass
from typing import Iterable, List, Sequence

from sqlalchemy.orm import selectinload
from sqlmodel import select

from common.database.postgres_models import Minute, MinuteVersion, Transcription

STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "into",
    "have",
    "has",
    "had",
    "they",
    "them",
    "their",
    "were",
    "will",
    "would",
    "could",
    "should",
    "about",
    "into",
    "onto",
    "over",
    "under",
    "after",
    "before",
    "during",
    "within",
    "without",
    "been",
    "are",
    "was",
    "is",
    "a",
    "an",
    "of",
    "to",
    "in",
    "on",
    "at",
}

# Simple heuristic: manual typing estimated at 4x audio length (listen + type).
MANUAL_TYPING_FACTOR = 4.0


@dataclass
class InsightMetrics:
    audio_minutes: float
    time_saved_minutes: float
    transcription_count: int
    minute_count: int
    avg_audio_minutes: float
    topics: list[tuple[str, int]]


def _transcription_duration_minutes(transcription: Transcription) -> float:
    if not transcription.dialogue_entries:
        return 0.0
    try:
        end_times = [entry.get("end_time") for entry in transcription.dialogue_entries if entry.get("end_time")]
        if not end_times:
            return 0.0
        duration_seconds = max(end_times)
        return float(duration_seconds) / 60.0
    except Exception:
        return 0.0


def _extract_topics(minutes: Sequence[Minute], top_n: int = 5) -> list[tuple[str, int]]:
    counter: Counter[str] = Counter()
    for minute in minutes:
        if not minute.minute_versions:
            continue
        latest: MinuteVersion | None = minute.minute_versions[0]
        if not latest or not latest.html_content:
            continue
        words = latest.html_content.replace("<", " ").replace(">", " ").split()
        for word in words:
            token = "".join(ch for ch in word if ch.isalpha()).lower()
            if len(token) < 4 or token in STOPWORDS:
                continue
            counter[token] += 1
    return counter.most_common(top_n)


async def load_insights_data(session, organisation_id, service_domain_id=None):
    transcription_query = select(Transcription).where(Transcription.organisation_id == organisation_id)
    if service_domain_id:
        transcription_query = transcription_query.where(Transcription.service_domain_id == service_domain_id)
    transcription_query = transcription_query.options(selectinload(Transcription.minutes))

    minute_query = (
        select(Minute)
        .where(Minute.organisation_id == organisation_id)
        .options(selectinload(Minute.minute_versions))
    )
    if service_domain_id:
        minute_query = minute_query.where(Minute.service_domain_id == service_domain_id)

    transcriptions = (await session.exec(transcription_query)).all()
    minutes = (await session.exec(minute_query)).all()
    return transcriptions, minutes


def compute_insights(transcriptions: Iterable[Transcription], minutes: Iterable[Minute]) -> InsightMetrics:
    transcriptions_list = list(transcriptions)
    minutes_list = list(minutes)

    audio_minutes_list: List[float] = []
    for t in transcriptions_list:
        duration = _transcription_duration_minutes(t)
        if duration > 0:
            audio_minutes_list.append(duration)

    total_audio_minutes = sum(audio_minutes_list)
    avg_audio = total_audio_minutes / len(audio_minutes_list) if audio_minutes_list else 0.0
    time_saved = sum(
        max(0.0, duration * (MANUAL_TYPING_FACTOR - 1.0)) for duration in audio_minutes_list
    )

    topics = _extract_topics(minutes_list)

    return InsightMetrics(
        audio_minutes=round(total_audio_minutes, 2),
        time_saved_minutes=round(time_saved, 2),
        transcription_count=len(transcriptions_list),
        minute_count=len(minutes_list),
        avg_audio_minutes=round(avg_audio, 2),
        topics=topics,
    )
