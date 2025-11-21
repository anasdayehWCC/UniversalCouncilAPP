# flake8: noqa: E501
from datetime import datetime
from zoneinfo import ZoneInfo

from common.database.postgres_models import DialogueEntry
from common.prompts import get_transcript_messages
from common.templates.types import SimpleTemplate
from common.types import AgendaUsage


class StrategyDiscussion(SimpleTemplate):
    name = "Strategy discussion"
    category = "Child protection"
    description = "Strategy discussion summary with threshold, risks, and actions"
    citations_required = True
    agenda_usage = AgendaUsage.REQUIRED
    service_domains = ["children"]

    @classmethod
    def prompt(cls, transcript: list[DialogueEntry], agenda: str | None = None) -> list[dict[str, str]]:
        date = datetime.now(tz=ZoneInfo("Europe/London")).strftime("%d %B %Y")
        prompt = f"""
Produce a concise strategy discussion record ({date}) referencing transcript timestamps.
Sections:
- Participants and purpose (only if named)
- Threshold / significant harm analysis (risk_flags)
- Child voice / immediate safety
- Information shared (chronological bullets)
- Decisions (s47 enquiry, medicals, joint visits, legal considerations)
- Actions (owner, timeframe)
- Contingency / review date

Rules: British English; keep to evidence; cite [start-end] after each bullet; if agenda provided, align information under those headings.
"""
        if agenda:
            prompt += "\nAgenda items:\n" + "\n".join(f"- {line}" for line in agenda.splitlines() if line.strip())
        return [
            {"role": "system", "content": prompt},
            get_transcript_messages(transcript),
        ]
