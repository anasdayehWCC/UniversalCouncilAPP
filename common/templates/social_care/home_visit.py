# flake8: noqa: E501
from datetime import datetime
from zoneinfo import ZoneInfo

from common.database.postgres_models import DialogueEntry
from common.prompts import get_transcript_messages
from common.templates.types import SimpleTemplate
from common.types import AgendaUsage


class HomeVisit(SimpleTemplate):
    name = "Home visit"
    category = "Children's social care"
    description = "Structured home visit summary with safety, voice of the child, and actions"
    citations_required = True
    agenda_usage = AgendaUsage.OPTIONAL
    service_domains = ["children"]

    @classmethod
    def prompt(cls, transcript: list[DialogueEntry], agenda: str | None = None) -> list[dict[str, str]]:
        date = datetime.now(tz=ZoneInfo("Europe/London")).strftime("%d %B %Y")

        agenda_block = ""
        if agenda:
            agenda_block = "Use these visit focus points as subheadings:\n" + "\n".join(
                f"- {line}" for line in agenda.splitlines() if line.strip()
            )

        prompt = f"""
You are producing statutory-standard children’s social care visit notes for a home visit conducted on {date}.
Use British English, professional tone, concise bullet sections, WCAG-friendly formatting, and cite transcript timestamps.

Required sections:
1) Visit context
   - Purpose, location, who was present (only if stated), visit_type and case_reference if present.
2) Voice of the child
   - Observations and direct quotes; note affect, behaviour, communication style.
3) Safety and risk
   - Current risks/concerns (risk_flags), protective factors, living conditions.
4) Health, education, daily life
5) Parenting and relationships
6) Actions and decisions
   - Agreed actions, owner, timeframe; intended_outcomes.
7) Next steps & review dates

Rules:
- Include only information evidenced in the transcript; no hallucinations.
- Keep neutral, avoid judgemental language.
- Cite every factual statement with [start-end] timestamps.
- If information is missing, state “Not discussed”.
{agenda_block}
"""
        return [
            {"role": "system", "content": prompt},
            get_transcript_messages(transcript),
        ]
