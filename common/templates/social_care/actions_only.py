# flake8: noqa: E501
from datetime import datetime
from zoneinfo import ZoneInfo

from common.database.postgres_models import DialogueEntry
from common.prompts import get_transcript_messages
from common.templates.types import SimpleTemplate
from common.types import AgendaUsage


class ActionsOnly(SimpleTemplate):
    name = "Actions only"
    category = "Manager view"
    description = "Concise list of actions/decisions with timestamps"
    citations_required = True
    agenda_usage = AgendaUsage.NOT_USED
    service_domains = ["children", "adults"]

    @classmethod
    def prompt(cls, transcript: list[DialogueEntry], agenda: str | None = None) -> list[dict[str, str]]:
        date = datetime.now(tz=ZoneInfo("Europe/London")).strftime("%d %B %Y")
        prompt = f"""
Produce an actions-only summary ({date}) with timestamp citations.
Include only:
- Decisions made (what, who, by when)
- Actions and owners with deadlines
- Risks/assumptions relevant to the actions
Keep to bullet points, max 250 words, cite [start-end].
"""
        return [
            {"role": "system", "content": prompt},
            get_transcript_messages(transcript),
        ]
