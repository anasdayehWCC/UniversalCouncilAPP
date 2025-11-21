# flake8: noqa: E501
from datetime import datetime
from zoneinfo import ZoneInfo

from common.database.postgres_models import DialogueEntry
from common.prompts import get_transcript_messages
from common.templates.types import SimpleTemplate
from common.types import AgendaUsage


class AdultSafeguarding(SimpleTemplate):
    name = "Adult safeguarding"
    category = "Adults social care"
    description = "Section 42 safeguarding conversation summary"
    citations_required = True
    agenda_usage = AgendaUsage.OPTIONAL
    service_domains = ["adults"]

    @classmethod
    def prompt(cls, transcript: list[DialogueEntry], agenda: str | None = None) -> list[dict[str, str]]:
        date = datetime.now(tz=ZoneInfo("Europe/London")).strftime("%d %B %Y")
        prompt = f"""
Create an adult safeguarding note ({date}) with timestamped evidence.
Sections:
- Concern summary and alleged risk
- Mental capacity/self-determination noted?
- Views of the adult (direct quotes)
- Risk assessment (risk_flags) & protective factors
- Actions/decisions, thresholds, partner notifications
- Outcomes sought by adult (intended_outcomes) + next steps
"""
        if agenda:
            prompt += "\nAgenda:\n" + "\n".join(f"- {line}" for line in agenda.splitlines() if line.strip())
        return [
            {"role": "system", "content": prompt},
            get_transcript_messages(transcript),
        ]
