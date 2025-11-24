# flake8: noqa: E501
from datetime import datetime
from zoneinfo import ZoneInfo

from common.database.postgres_models import DialogueEntry
from common.prompts import get_transcript_messages
from common.templates.types import SimpleTemplate
from common.types import AgendaUsage


class ChildProtectionConference(SimpleTemplate):
    name = "Child protection conference"
    category = "Child protection"
    description = "ICPC/RCPC summary with threshold, risks, and plan"
    citations_required = True
    agenda_usage = AgendaUsage.REQUIRED
    service_domains = ["children"]

    @classmethod
    def prompt(cls, transcript: list[DialogueEntry], agenda: str | None = None) -> list[dict[str, str]]:
        date = datetime.now(tz=ZoneInfo("Europe/London")).strftime("%d %B %Y")
        agenda_block = ""
        if agenda:
            agenda_block = "\nAgenda:\n" + "\n".join(f"- {line}" for line in agenda.splitlines() if line.strip())
        prompt = f"""
Write a concise child protection conference summary ({date}) with timestamp citations.
Sections:
- Purpose & participants (if stated)
- Harm/neglect analysis and threshold
- Voice of child / family views
- Risk factors vs protective factors (risk_flags)
- Plan/Outcomes (intended_outcomes) and actions with owners/dates
- Review date
{agenda_block}
"""
        return [
            {"role": "system", "content": prompt},
            get_transcript_messages(transcript),
        ]
