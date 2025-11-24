# flake8: noqa: E501
from datetime import datetime
from zoneinfo import ZoneInfo

from common.database.postgres_models import DialogueEntry
from common.prompts import get_transcript_messages
from common.templates.types import SimpleTemplate
from common.types import AgendaUsage


class ManagerSummary(SimpleTemplate):
    name = "Manager summary"
    category = "Manager view"
    description = "High-level briefing for managers with key risks, decisions, next steps"
    citations_required = True
    agenda_usage = AgendaUsage.NOT_USED
    service_domains = ["children", "adults"]

    @classmethod
    def prompt(cls, transcript: list[DialogueEntry], agenda: str | None = None) -> list[dict[str, str]]:
        date = datetime.now(tz=ZoneInfo("Europe/London")).strftime("%d %B %Y")
        prompt = f"""
Create a managerial briefing ({date}) under 200 words with timestamp citations.
Include:
- Case headline (case_reference if present), visit_type
- Top 3 risks/concerns and protective factors
- Key decisions and rationale
- Next steps / deadlines / owners
"""
        return [
            {"role": "system", "content": prompt},
            get_transcript_messages(transcript),
        ]
