# flake8: noqa: E501
from datetime import datetime
from zoneinfo import ZoneInfo

from common.database.postgres_models import DialogueEntry
from common.prompts import get_transcript_messages
from common.templates.types import SimpleTemplate
from common.types import AgendaUsage


class ChronologyUpdate(SimpleTemplate):
    name = "Chronology update"
    category = "Chronology"
    description = "Chronology-style update with dated events and citations"
    citations_required = True
    agenda_usage = AgendaUsage.NOT_USED
    service_domains = ["children", "adults"]

    @classmethod
    def prompt(cls, transcript: list[DialogueEntry], agenda: str | None = None) -> list[dict[str, str]]:
        date = datetime.now(tz=ZoneInfo("Europe/London")).strftime("%d %B %Y")
        prompt = f"""
Create a chronology update ({date}) as bullet events with timestamp citations.
For each event include: date/time (from transcript context if stated, else recording order), what happened, who was involved, risk/impact, action/outcome.
Keep neutral, concise, cite [start-end].
"""
        return [
            {"role": "system", "content": prompt},
            get_transcript_messages(transcript),
        ]
