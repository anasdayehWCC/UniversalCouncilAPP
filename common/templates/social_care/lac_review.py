# flake8: noqa: E501
from datetime import datetime
from zoneinfo import ZoneInfo

from common.database.postgres_models import DialogueEntry
from common.prompts import get_transcript_messages
from common.templates.types import SimpleTemplate
from common.types import AgendaUsage


class LACReview(SimpleTemplate):
    name = "LAC review"
    category = "Children looked after"
    description = "Looked-after child review summary with outcomes and actions"
    citations_required = True
    agenda_usage = AgendaUsage.OPTIONAL
    service_domains = ["children"]

    @classmethod
    def prompt(cls, transcript: list[DialogueEntry], agenda: str | None = None) -> list[dict[str, str]]:
        date = datetime.now(tz=ZoneInfo("Europe/London")).strftime("%d %B %Y")
        prompt = f"""
Generate a LAC review record dated {date}.
Sections:
1) Placement & stability
2) Health and education
3) Contact & relationships
4) Safety/risk (risk_flags)
5) Voice of the child / wishes and feelings
6) Progress against care plan outcomes (intended_outcomes)
7) Actions and timescales

Use bullet points, British English, timestamp citations [start-end]. If agenda provided, integrate headings accordingly.
"""
        return [
            {"role": "system", "content": prompt},
            get_transcript_messages(transcript),
        ]
