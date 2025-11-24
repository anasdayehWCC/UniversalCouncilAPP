import logging
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import List
from uuid import UUID

from sqlalchemy.orm import selectinload
from sqlmodel import select

from common.database.postgres_database import SessionLocal
from common.database.postgres_models import Minute, MinuteTask, TaskSource, TaskStatus
from common.llm.client import FastOrBestLLM, create_default_chatbot
from common.prompts import get_task_extraction_prompt
from common.services.msgraph_client import MSGraphClient
from common.settings import get_settings
from common.types import TaskExtractionCandidate

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass(slots=True)
class TaskCandidate:
    description: str
    owner: str | None = None
    owner_role: str | None = None
    due_date: datetime | None = None


class TaskExtractionService:
    MAX_TASKS = 10
    OWNER_KEYWORDS = {
        "social worker": ("Social worker", "social_worker"),
        "manager": ("Team manager", "manager"),
        "supervisor": ("Supervisor", "manager"),
        "parent": ("Parent / carer", "parent"),
        "carer": ("Parent / carer", "parent"),
        "school": ("School / education", "education"),
        "gp": ("GP", "health"),
        "health": ("Health professional", "health"),
    }
    DATE_PATTERNS = (
        (re.compile(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b"), ("%d/%m/%Y", "%d/%m/%y")),
        (re.compile(r"\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b", re.IGNORECASE), ("%d %B",)),
    )

    @classmethod
    async def sync_generated_tasks(cls, minute_id: UUID, html_content: str | None) -> list[MinuteTask]:
        candidates = await cls._generate_candidates(html_content)
        if not candidates:
            logger.info("No task candidates detected for minute %s", minute_id)
            cls._delete_ai_tasks(minute_id)
            return []

        with SessionLocal() as session:
            minute = session.get(
                Minute,
                minute_id,
                options=[selectinload(Minute.tasks)],
            )
            if not minute:
                msg = f"Minute {minute_id} not found"
                raise ValueError(msg)

            for task in list(minute.tasks):
                if task.source == TaskSource.AI_GENERATED:
                    session.delete(task)

            created: list[MinuteTask] = []
            for candidate in candidates[: cls.MAX_TASKS]:
                minute_task = MinuteTask(
                    minute_id=minute.id,
                    organisation_id=minute.organisation_id,
                    service_domain_id=minute.service_domain_id,
                    case_id=minute.case_id,
                    description=candidate.description,
                    owner=candidate.owner,
                    owner_role=candidate.owner_role,
                    due_date=candidate.due_date,
                    status=TaskStatus.PENDING,
                    source=TaskSource.AI_GENERATED,
                )
                session.add(minute_task)
                created.append(minute_task)

            session.commit()
            for task in created:
                session.refresh(task)
                session.expunge(task)
            return created

    @classmethod
    def attach_planner_ids(cls, minute_id: UUID, planner_ids: list[str], only_without_ids: bool = True) -> None:
        if not planner_ids:
            return
        with SessionLocal() as session:
            query = (
                select(MinuteTask)
                .where(MinuteTask.minute_id == minute_id)
                .order_by(MinuteTask.created_datetime.desc())
            )
            if only_without_ids:
                query = query.where(MinuteTask.planner_task_id.is_(None))
            tasks = session.exec(query).all()
            now_ts = datetime.now(tz=UTC)
            for task, planner_id in zip(tasks, planner_ids, strict=False):
                task.planner_task_id = planner_id
                task.last_synced_at = now_ts
                session.add(task)
            minute = session.get(Minute, minute_id)
            if minute:
                existing_ids = minute.planner_task_ids or []
                merged = existing_ids + planner_ids
                seen: set[str] = set()
                minute.planner_task_ids = [pid for pid in merged if not (pid in seen or seen.add(pid))]
                minute.last_exported_at = minute.last_exported_at or now_ts
                session.add(minute)
            session.commit()

    @classmethod
    async def push_tasks_to_planner(cls, minute_id: UUID, minute: Minute | None = None, only_missing: bool = True) -> list[str]:
        if not settings.MS_GRAPH_ENABLED:
            return []
        tasks = cls._get_tasks_for_minute(minute_id, only_missing)
        if not tasks:
            return []
        if not minute:
            minute = cls._get_minute(minute_id)
        if not minute:
            return []
        planner_client = MSGraphClient()
        planner_ids = await planner_client.create_planner_tasks(tasks, minute)
        cls.attach_planner_ids(minute_id, planner_ids, only_without_ids=only_missing)
        return planner_ids

    @classmethod
    def extract_candidates(cls, html_content: str | None) -> List[TaskCandidate]:
        if not html_content:
            return []
        bullets = re.findall(r"<li>(.*?)</li>", html_content, flags=re.IGNORECASE | re.DOTALL)
        lines = [cls._clean_text(item) for item in bullets]
        if not lines:
            flattened = cls._clean_text(html_content)
            lines = [line.strip() for line in flattened.splitlines() if line.strip()]

        seen: set[str] = set()
        candidates: list[TaskCandidate] = []
        for line in lines:
            if not cls._looks_like_task(line):
                continue
            description = cls._normalise_description(line)
            if description.lower() in seen:
                continue
            seen.add(description.lower())
            owner, owner_role = cls._infer_owner(description)
            due_date = cls._infer_due_date(description)
            candidates.append(
                TaskCandidate(description=description, owner=owner, owner_role=owner_role, due_date=due_date)
            )
        return candidates

    @classmethod
    def _delete_ai_tasks(cls, minute_id: UUID) -> None:
        with SessionLocal() as session:
            tasks = session.exec(
                select(MinuteTask).where(
                    MinuteTask.minute_id == minute_id,
                    MinuteTask.source == TaskSource.AI_GENERATED,
                )
            ).all()
            for task in tasks:
                session.delete(task)
            session.commit()

    @staticmethod
    def _clean_text(value: str) -> str:
        text = re.sub(r"<(script|style)[^>]*>.*?</\\1>", " ", value, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"&nbsp;", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def _looks_like_task(line: str) -> bool:
        lowered = line.lower()
        if not lowered:
            return False
        if lowered.startswith("action"):
            return True
        verbs = (" to ", " ensure ", " review ", " follow up", "submit", "arrange")
        return any(token in lowered for token in verbs)

    @staticmethod
    def _normalise_description(line: str) -> str:
        stripped = line.strip()
        lowered = stripped.lower()
        if lowered.startswith("action:"):
            return stripped.split(":", 1)[1].strip()
        return stripped

    @classmethod
    def _infer_owner(cls, line: str) -> tuple[str | None, str | None]:
        lowered = line.lower()
        for keyword, (label, role) in cls.OWNER_KEYWORDS.items():
            if keyword in lowered:
                return label, role
        return None, None

    @classmethod
    def _infer_due_date(cls, line: str) -> datetime | None:
        for pattern, fmts in cls.DATE_PATTERNS:
            match = pattern.search(line)
            if not match:
                continue
            raw = match.group(0)
            for fmt in fmts:
                try:
                    parsed = datetime.strptime(raw, fmt)
                    if parsed.year == 1900:
                        parsed = parsed.replace(year=datetime.now(tz=UTC).year)
                    return parsed.replace(tzinfo=UTC)
                except ValueError:
                    continue
        return None

    @classmethod
    async def _generate_candidates(cls, html_content: str | None) -> list[TaskCandidate]:
        llm_candidates = await cls._extract_llm_candidates(html_content)
        if llm_candidates:
            return llm_candidates
        return cls.extract_candidates(html_content)

    @classmethod
    async def _extract_llm_candidates(cls, html_content: str | None) -> list[TaskCandidate]:
        if not html_content:
            return []
        try:
            chatbot = create_default_chatbot(FastOrBestLLM.FAST)
        except Exception:
            logger.exception("Unable to initialise chatbot for task extraction")
            return []
        try:
            response = await chatbot.structured_chat(
                get_task_extraction_prompt(cls._prepare_minutes_for_llm(html_content)),
                response_format=list[TaskExtractionCandidate],
            )
        except Exception:
            logger.exception("Task extraction LLM request failed")
            return []
        return [
            TaskCandidate(
                description=item.description.strip(),
                owner=item.owner,
                owner_role=item.owner_role,
                due_date=item.due_date,
            )
            for item in response
            if item.description
        ]

    @classmethod
    def _get_tasks_for_minute(cls, minute_id: UUID, only_unsynced: bool = False) -> list[MinuteTask]:
        with SessionLocal() as session:
            query = select(MinuteTask).where(MinuteTask.minute_id == minute_id)
            if only_unsynced:
                query = query.where(MinuteTask.planner_task_id.is_(None))
            tasks = session.exec(query.order_by(MinuteTask.created_datetime.desc())).all()
            for task in tasks:
                session.expunge(task)
            return tasks

    @classmethod
    def _get_minute(cls, minute_id: UUID) -> Minute | None:
        with SessionLocal() as session:
            minute = session.get(Minute, minute_id)
            if minute:
                session.expunge(minute)
            return minute

    @staticmethod
    def _prepare_minutes_for_llm(value: str) -> str:
        return re.sub(r"<(script|style)[^>]*>.*?</\\1>", " ", value, flags=re.IGNORECASE | re.DOTALL)
