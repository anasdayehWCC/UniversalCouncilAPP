# flake8: noqa: E501
from datetime import datetime
from zoneinfo import ZoneInfo

from common.database.postgres_models import DialogueEntry
from common.prompts import get_transcript_messages
from common.templates.types import SimpleTemplate
from common.types import AgendaUsage


class Supervision(SimpleTemplate):
    name = "Supervision"
    category = "Practice supervision"
    description = "Supervision note with reflection, risk, decisions, and manager actions"
    citations_required = True
    agenda_usage = AgendaUsage.OPTIONAL
    service_domains = ["children", "adults"]

    @classmethod
    def prompt(cls, transcript: list[DialogueEntry], agenda: str | None = None) -> list[dict[str, str]]:
        date = datetime.now(tz=ZoneInfo("Europe/London")).strftime("%d %B %Y")
        prompt = f"""
Create supervision minutes dated {date}. Tone: reflective, concise, professional.
Sections:
1) Case reference & focus (include visit_type/intended_outcomes if mentioned)
2) Presenting situation & risk overview (risk_flags)
3) Analysis & reflection (what is working well / worries / hypotheses)
4) Decisions & management guidance
5) Actions with owners and due dates
6) Contingency / escalation

Rules:
- Cite statements with [start-end] timestamps.
- Only include evidence from transcript; flag gaps as “Not discussed”.
"""
        if agenda:
            prompt += f"\nAgenda to cover:\n{agenda}\n"
        return [
            {"role": "system", "content": prompt},
            get_transcript_messages(transcript),
        ]
