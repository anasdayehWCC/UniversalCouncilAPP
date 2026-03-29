from __future__ import annotations

from datetime import datetime
from enum import StrEnum, auto
from typing import TypedDict, List
from uuid import UUID, uuid4

from pydantic import computed_field
from sqlalchemy import TIMESTAMP, Column, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.sql.functions import now
from sqlmodel import Field, Relationship, SQLModel, col, func, text


class DialogueEntry(TypedDict):
    speaker: str
    text: str
    start_time: float
    end_time: float
    canonical_speaker: str | None


# Create factory functions for columns to avoid reusing column objects
def created_datetime_column():
    return Column(TIMESTAMP(timezone=True), nullable=False, server_default=now(), default=None)


def updated_datetime_column():
    return Column(TIMESTAMP(timezone=True), nullable=False, server_default=now(), default=None)


class BaseTableMixin(SQLModel):
    # Note, we can't add created/updated_datetime Columns here, as each table needs its own instance of these Columns
    model_config = {  # noqa: RUF012
        "from_attributes": True,
    }

    id: UUID = Field(
        default_factory=uuid4, primary_key=True, sa_column_kwargs={"server_default": func.gen_random_uuid()}
    )


class JobStatus(StrEnum):
    AWAITING_START = auto()
    IN_PROGRESS = auto()
    COMPLETED = auto()
    FAILED = auto()


class ExportStatus(StrEnum):
    AWAITING_START = auto()
    IN_PROGRESS = auto()
    COMPLETED = auto()
    FAILED = auto()


class ContentSource(StrEnum):
    MANUAL_EDIT = auto()
    AI_EDIT = auto()
    INITIAL_GENERATION = auto()


class TaskStatus(StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskSource(StrEnum):
    AI_GENERATED = "ai_generated"
    MANUAL = "manual"


class ColorMode(StrEnum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"




class HallucinationType(StrEnum):
    FACTUAL_FABRICATION = auto()
    NONSENSICAL = auto()
    CONTRADICTION = auto()
    MISLEADING = auto()
    OTHER = auto()





class Organisation(BaseTableMixin, table=True):
    __tablename__ = "organisation"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    name: str = Field(index=True)
    domains: List["ServiceDomain"] = Relationship(
        back_populates="organisation",
        sa_relationship=relationship("ServiceDomain", back_populates="organisation"),
    )
    users: List["UserOrgRole"] = Relationship(
        back_populates="organisation",
        sa_relationship=relationship("UserOrgRole", back_populates="organisation"),
    )


class ServiceDomain(BaseTableMixin, table=True):
    __tablename__ = "service_domain"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    name: str = Field(index=True)
    organisation_id: UUID = Field(foreign_key="organisation.id", ondelete="CASCADE")
    organisation: Organisation = Relationship(back_populates="domains")
    users: List["UserOrgRole"] = Relationship(
        back_populates="service_domain",
        sa_relationship=relationship("UserOrgRole", back_populates="service_domain"),
    )
    templates: List["ServiceDomainTemplate"] = Relationship(
        back_populates="service_domain",
        sa_relationship=relationship("ServiceDomainTemplate", back_populates="service_domain"),
    )


class Role(BaseTableMixin, table=True):
    __tablename__ = "role"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    name: str = Field(unique=True, index=True)
    description: str | None = None
    users: List["UserOrgRole"] = Relationship(
        back_populates="role",
        sa_relationship=relationship("UserOrgRole", back_populates="role"),
    )


class UserOrgRole(BaseTableMixin, table=True):
    __tablename__ = "user_org_role"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    user_id: UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    organisation_id: UUID = Field(foreign_key="organisation.id", ondelete="CASCADE")
    service_domain_id: UUID | None = Field(foreign_key="service_domain.id", ondelete="CASCADE", default=None)
    role_id: UUID = Field(foreign_key="role.id", ondelete="CASCADE")

    user: "User" = Relationship(
        back_populates="org_roles",
        sa_relationship=relationship("User", back_populates="org_roles"),
    )
    organisation: Organisation = Relationship(back_populates="users")
    service_domain: ServiceDomain | None = Relationship(
        back_populates="users",
        sa_relationship=relationship("ServiceDomain", back_populates="users"),
    )
    role: Role = Relationship(back_populates="users")


class ServiceDomainTemplate(BaseTableMixin, table=True):
    __tablename__ = "service_domain_template"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    service_domain_id: UUID = Field(foreign_key="service_domain.id", ondelete="CASCADE")
    service_domain: ServiceDomain = Relationship(back_populates="templates")
    template_name: str = Field(index=True)
    enabled: bool = Field(default=True, sa_column_kwargs={"server_default": "true"})


# Main models with table=True for DB tables
class User(BaseTableMixin, table=True):
    __tablename__ = "user"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    email: str = Field(index=True)
    data_retention_days: int | None = Field(default=30)
    preferences: List["UserPreference"] = Relationship(
        back_populates="user",
        sa_relationship=relationship("UserPreference", back_populates="user"),
    )
    transcriptions: List["Transcription"] = Relationship(
        back_populates="user",
        sa_relationship=relationship("Transcription", back_populates="user"),
    )
    org_roles: List["UserOrgRole"] = Relationship(
        back_populates="user",
        sa_relationship=relationship("UserOrgRole", back_populates="user"),
    )

    @computed_field
    @property
    def strict_data_retention(self) -> bool:
        try:
            username, domain = self.email.split("@", maxsplit=1)
            return "cabinetoffice" in domain.lower() or "dsit" in domain.lower()
        except ValueError:
            return False


class UserPreference(BaseTableMixin, table=True):
    __tablename__ = "user_preference"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_preference_user_id"),
    )

    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    user_id: UUID = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    color_mode: str = Field(default=ColorMode.SYSTEM.value, index=True)

    user: User = Relationship(
        back_populates="preferences",
        sa_relationship=relationship("User", back_populates="preferences"),
    )


class Case(BaseTableMixin, table=True):
    __tablename__ = "case_record"
    __table_args__ = (
        UniqueConstraint(
            "case_reference", "organisation_id", "service_domain_id", name="uq_case_record_ref_org_domain"
        ),
    )

    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)

    case_reference: str = Field(index=True)
    organisation_id: UUID = Field(foreign_key="organisation.id", ondelete="CASCADE")
    organisation: Organisation | None = Relationship(
        sa_relationship=relationship("Organisation", lazy="joined"),
    )
    service_domain_id: UUID | None = Field(foreign_key="service_domain.id", ondelete="SET NULL")
    service_domain: ServiceDomain | None = Relationship(
        sa_relationship=relationship("ServiceDomain", lazy="joined"),
    )
    worker_team: str | None = Field(default=None)
    subject_initials: str | None = Field(default=None)
    subject_dob_ciphertext: str | None = Field(default=None)

    minutes: list["Minute"] = Relationship(
        back_populates="case",
        sa_relationship=relationship("Minute", back_populates="case"),
    )
    transcriptions: list["Transcription"] = Relationship(
        back_populates="case",
        sa_relationship=relationship("Transcription", back_populates="case"),
    )


class Recording(BaseTableMixin, table=True):
    __tablename__ = "recording"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    user_id: UUID = Field(foreign_key="user.id", nullable=False)
    s3_file_key: str
    transcription_id: UUID | None = Field(default=None, foreign_key="transcription.id", ondelete="SET NULL")
    transcription: "Transcription" = Relationship(
        back_populates="recordings",
        sa_relationship=relationship("Transcription", back_populates="recordings"),
    )
    organisation_id: UUID | None = Field(default=None, foreign_key="organisation.id", ondelete="SET NULL")
    service_domain_id: UUID | None = Field(default=None, foreign_key="service_domain.id", ondelete="SET NULL")
    captured_offline: bool = Field(default=False, sa_column_kwargs={"server_default": "false"})


class Chat(BaseTableMixin, table=True):
    __tablename__ = "chat"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    transcription_id: UUID = Field(foreign_key="transcription.id", ondelete="CASCADE")
    transcription: "Transcription" = Relationship(
        back_populates="chat",
        sa_relationship=relationship("Transcription", back_populates="chat"),
    )
    user_content: str = Field(default=None)
    assistant_content: str | None = Field(default=None)
    status: JobStatus = Field(
        default=JobStatus.AWAITING_START, sa_column_kwargs={"server_default": JobStatus.AWAITING_START.name}
    )
    error: str | None = Field(default=None)

class TranscriptionFeedback(BaseTableMixin, table=True):
    __tablename__ = "transcription_feedback"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)

    transcription_id: UUID = Field(foreign_key="transcription.id", ondelete="CASCADE")
    transcription: "Transcription" = Relationship(
        back_populates="feedback",
        sa_relationship=relationship("Transcription", back_populates="feedback"),
    )
    organisation_id: UUID = Field(foreign_key="organisation.id", ondelete="CASCADE")
    organisation: Organisation = Relationship(
        sa_relationship=relationship("Organisation"),
    )
    service_domain_id: UUID | None = Field(foreign_key="service_domain.id", ondelete="SET NULL")
    service_domain: ServiceDomain | None = Relationship(
        sa_relationship=relationship("ServiceDomain"),
    )
    payload: dict = Field(sa_column=Column(JSONB, nullable=False))
    wer: float | None = Field(default=None)
    der: float | None = Field(default=None)


class Transcription(BaseTableMixin, table=True):
    __tablename__ = "transcription"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    title: str | None = Field(default=None)
    dialogue_entries: list[DialogueEntry] | None = Field(default=None, sa_column=Column(JSONB))
    status: JobStatus = Field(
        default=JobStatus.AWAITING_START, sa_column_kwargs={"server_default": JobStatus.AWAITING_START.name}
    )
    error: str | None = Field(default=None)
    user: User | None = Relationship(
        back_populates="transcriptions",
        sa_relationship=relationship("User", back_populates="transcriptions"),
    )
    user_id: UUID | None = Field(default=None, foreign_key="user.id")
    organisation_id: UUID | None = Field(default=None, foreign_key="organisation.id", ondelete="SET NULL")
    service_domain_id: UUID | None = Field(default=None, foreign_key="service_domain.id", ondelete="SET NULL")
    case_id: UUID | None = Field(default=None, foreign_key="case_record.id", ondelete="SET NULL")
    case: "Case" | None = Relationship(
        back_populates="transcriptions",
        sa_relationship=relationship("Case", back_populates="transcriptions"),
    )
    case_reference: str | None = Field(default=None, index=True)
    worker_team: str | None = Field(default=None)
    subject_initials: str | None = Field(default=None)
    subject_dob_ciphertext: str | None = Field(default=None)
    visit_type: str | None = Field(default=None)
    intended_outcomes: str | None = Field(default=None)
    risk_flags: str | None = Field(default=None)
    docx_blob_path: str | None = Field(default=None)
    pdf_blob_path: str | None = Field(default=None)
    sharepoint_docx_item_id: str | None = Field(default=None)
    sharepoint_pdf_item_id: str | None = Field(default=None)
    planner_task_ids: list[str] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="'[]'::jsonb"))
    export_status: ExportStatus | None = Field(default=None)
    export_error: str | None = Field(default=None)
    last_exported_at: datetime | None = Field(default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True))
    processing_mode: str = Field(default="fast", sa_column_kwargs={"server_default": "fast"})

    # Kept old minute versions so we can migrate them
    legacy_minute_versions: list[dict] | None = Field(sa_column=Column(name="minute_versions", type_=JSONB), default=[])
    translations: dict | None = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default="'{}'::jsonb"),
        description="Map of language code to translation metadata",
    )

    recordings: List[Recording] = Relationship(
        back_populates="transcription",
        sa_relationship=relationship("Recording", back_populates="transcription", order_by=col(Recording.created_datetime).desc()),
    )
    chat: List[Chat] = Relationship(
        back_populates="transcription",
        sa_relationship=relationship("Chat", back_populates="transcription", cascade="all, delete", order_by=col(Chat.created_datetime).desc()),
    )
    feedback: List["TranscriptionFeedback"] = Relationship(
        back_populates="transcription",
        sa_relationship=relationship("TranscriptionFeedback", back_populates="transcription"),
    )
    minutes: List["Minute"] = Relationship(
        back_populates="transcription",
        sa_relationship=relationship("Minute", back_populates="transcription"),
    )


class TemplateType(StrEnum):
    DOCUMENT = auto()
    FORM = auto()


class TemplateQuestion(BaseTableMixin, table=True):
    __tablename__ = "template_question"

    position: int
    title: str
    description: str

    user_template_id: UUID = Field(foreign_key="user_template.id", ondelete="CASCADE")
    user_template: "UserTemplate" = Relationship(
        back_populates="questions",
        sa_relationship=relationship("UserTemplate", back_populates="questions"),
    )


class UserTemplate(BaseTableMixin, table=True):
    __tablename__ = "user_template"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)

    name: str
    content: str
    description: str = ""

    type: TemplateType = TemplateType.DOCUMENT

    user_id: UUID | None = Field(default=None, foreign_key="user.id")

    minutes: List["Minute"] = Relationship(
        back_populates="user_template",
        sa_relationship=relationship("Minute", back_populates="user_template"),
    )

    questions: List[TemplateQuestion] = Relationship(
        back_populates="user_template",
        sa_relationship=relationship("TemplateQuestion", back_populates="user_template", passive_deletes="all", order_by=TemplateQuestion.position),
    )


class Minute(BaseTableMixin, table=True):
    __tablename__ = "minute"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    transcription_id: UUID = Field(foreign_key="transcription.id", ondelete="CASCADE")
    transcription: "Transcription" = Relationship(
        back_populates="minutes",
        sa_relationship=relationship("Transcription", back_populates="minutes"),
    )
    template_name: str = Field(default="General")
    user_template_id: UUID | None = Field(
        foreign_key="user_template.id", nullable=True, ondelete="SET NULL", default=None
    )
    user_template: "UserTemplate" = Relationship(
        back_populates="minutes",
        sa_relationship=relationship("UserTemplate", back_populates="minutes"),
    )
    created_by_user_id: UUID | None = Field(default=None, foreign_key="user.id", ondelete="SET NULL")
    created_by: User | None = Relationship(
        sa_relationship=relationship("User", foreign_keys="Minute.created_by_user_id"),
    )
    agenda: str | None = Field(nullable=True, default=None)
    minute_versions: List["MinuteVersion"] = Relationship(
        back_populates="minute",
        sa_relationship=relationship("MinuteVersion", back_populates="minute", cascade="all, delete", order_by="MinuteVersion.created_datetime.desc()"),
    )
    organisation_id: UUID | None = Field(default=None, foreign_key="organisation.id", ondelete="SET NULL")
    service_domain_id: UUID | None = Field(default=None, foreign_key="service_domain.id", ondelete="SET NULL")
    case_id: UUID | None = Field(default=None, foreign_key="case_record.id", ondelete="SET NULL")
    case: "Case" | None = Relationship(
        back_populates="minutes",
        sa_relationship=relationship("Case", back_populates="minutes"),
    )
    case_reference: str | None = Field(default=None, index=True)
    worker_team: str | None = Field(default=None)
    subject_initials: str | None = Field(default=None)
    subject_dob_ciphertext: str | None = Field(default=None)
    visit_type: str | None = Field(default=None)
    intended_outcomes: str | None = Field(default=None)
    risk_flags: str | None = Field(default=None)
    docx_blob_path: str | None = Field(default=None)
    pdf_blob_path: str | None = Field(default=None)
    sharepoint_docx_item_id: str | None = Field(default=None)
    sharepoint_pdf_item_id: str | None = Field(default=None)
    planner_task_ids: List[str] = Field(
        default_factory=list,
        sa_column=Column(JSONB, nullable=False, server_default="'[]'::jsonb"),
    )
    tags: List[str] = Field(
        default_factory=list,
        sa_column=Column(JSONB, nullable=False, server_default="'[]'::jsonb"),
    )
    export_status: ExportStatus | None = Field(default=None)
    export_error: str | None = Field(default=None)
    last_exported_at: datetime | None = Field(
        default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True)
    )
    tasks: List["MinuteTask"] = Relationship(
        back_populates="minute",
        sa_relationship=relationship(
            "MinuteTask",
            back_populates="minute",
            cascade="all, delete-orphan",
            order_by="MinuteTask.created_datetime.desc()",
        ),
    )


class MinuteVersion(BaseTableMixin, table=True):
    __tablename__ = "minute_version"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    minute_id: UUID = Field(foreign_key="minute.id", ondelete="CASCADE")
    minute: "Minute" = Relationship(
        back_populates="minute_versions",
        sa_relationship=relationship("Minute", back_populates="minute_versions"),
    )
    hallucinations: List["Hallucination"] = Relationship(
        back_populates="minute_version",
        sa_relationship=relationship("Hallucination", back_populates="minute_version", cascade="all, delete"),
    )
    html_content: str = Field(default="", sa_column_kwargs={"server_default": ""})
    status: JobStatus = Field(
        default=JobStatus.AWAITING_START, sa_column_kwargs={"server_default": JobStatus.AWAITING_START.name}
    )
    error: str | None = None
    ai_edit_instructions: str | None = Field(
        default=None, description="If the content source is an AI edit, store the instruction here"
    )

    content_source: ContentSource = Field(
        default=ContentSource.INITIAL_GENERATION,
        sa_column_kwargs={"server_default": ContentSource.INITIAL_GENERATION.name},
    )


class MinuteTask(BaseTableMixin, table=True):
    __tablename__ = "minute_task"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    minute_id: UUID = Field(foreign_key="minute.id", ondelete="CASCADE")
    minute: "Minute" = Relationship(
        back_populates="tasks",
        sa_relationship=relationship("Minute", back_populates="tasks"),
    )
    organisation_id: UUID | None = Field(default=None, foreign_key="organisation.id", ondelete="SET NULL")
    service_domain_id: UUID | None = Field(default=None, foreign_key="service_domain.id", ondelete="SET NULL")
    case_id: UUID | None = Field(default=None, foreign_key="case_record.id", ondelete="SET NULL")
    description: str = Field(default="")
    owner: str | None = Field(default=None)
    owner_role: str | None = Field(default=None)
    due_date: datetime | None = Field(
        default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True)
    )
    status: TaskStatus = Field(
        default=TaskStatus.PENDING,
        sa_column_kwargs={"server_default": TaskStatus.PENDING.value},
    )
    source: TaskSource = Field(
        default=TaskSource.AI_GENERATED,
        sa_column_kwargs={"server_default": TaskSource.AI_GENERATED.value},
    )
    notes: str | None = Field(default=None)
    planner_task_id: str | None = Field(default=None)
    last_synced_at: datetime | None = Field(
        default=None, sa_column=Column(TIMESTAMP(timezone=True), nullable=True)
    )


class Hallucination(BaseTableMixin, table=True):
    __tablename__ = "hallucination"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    minute_version_id: UUID = Field(foreign_key="minute_version.id", ondelete="CASCADE")
    minute_version: "MinuteVersion" = Relationship(
        back_populates="hallucinations",
        sa_relationship=relationship("MinuteVersion", back_populates="hallucinations"),
    )
    hallucination_type: HallucinationType = Field(description="Type of hallucination", default=HallucinationType.OTHER)
    hallucination_text: str | None = Field(description="Text of hallucination", default=None)
    hallucination_reason: str | None = Field(description="Reason for hallucination", default=None)


class RetentionPolicy(BaseTableMixin, table=True):
    __tablename__ = "retention_policy"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    organisation_id: UUID | None = Field(default=None, foreign_key="organisation.id", ondelete="CASCADE")
    service_domain_id: UUID | None = Field(default=None, foreign_key="service_domain.id", ondelete="CASCADE")
    audio_retention_days: int | None = Field(default=None)
    transcript_retention_days: int | None = Field(default=None)
    minute_retention_days: int | None = Field(default=None)
    strict_data_retention: bool = Field(default=True, sa_column_kwargs={"server_default": text("true")})


class AuditEvent(BaseTableMixin, table=True):
    __tablename__ = "audit_event"
    created_datetime: datetime = Field(sa_column=created_datetime_column(), default=None)
    updated_datetime: datetime = Field(sa_column=updated_datetime_column(), default=None)
    user_id: UUID | None = Field(default=None, foreign_key="user.id", ondelete="SET NULL")
    organisation_id: UUID | None = Field(default=None, foreign_key="organisation.id", ondelete="SET NULL")
    service_domain_id: UUID | None = Field(default=None, foreign_key="service_domain.id", ondelete="SET NULL")
    case_id: UUID | None = Field(default=None, foreign_key="case_record.id", ondelete="SET NULL")
    resource_type: str = Field(default="unknown")
    resource_id: UUID | None = Field(default=None)
    action: str = Field(default="")
    outcome: str = Field(default="unknown")
    path: str = Field(default="")
    ip_address: str | None = Field(default=None)
    user_agent: str | None = Field(default=None)
