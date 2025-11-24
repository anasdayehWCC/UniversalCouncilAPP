import uuid
from datetime import date, datetime
from enum import IntEnum, StrEnum, auto

from pydantic import BaseModel, Field

from common.database.postgres_models import (
    ContentSource,
    DialogueEntry,
    HallucinationType,
    JobStatus,
    TaskSource,
    TaskStatus,
    TemplateType,
)


class TranscriptionMetadata(BaseModel):
    """Pydantic model for transcription metadata."""

    id: uuid.UUID
    created_datetime: datetime
    title: str | None = None
    text: str
    status: JobStatus
    case_reference: str | None = None
    processing_mode: str | None = None
    visit_type: str | None = None
    worker_team: str | None = None


class PaginatedTranscriptionsResponse(BaseModel):
    """Paginated response for transcriptions."""

    items: list[TranscriptionMetadata]
    total_count: int
    page: int
    page_size: int
    total_pages: int


class TranscriptionCreateRequest(BaseModel):
    recording_id: uuid.UUID
    template_name: str
    template_id: uuid.UUID | None = None
    agenda: str | None = None
    title: str | None = None
    case_reference: str
    worker_team: str | None = None
    subject_initials: str | None = None
    subject_dob: date | None = None
    processing_mode: str | None = Field(
        default="fast", description="fast (realtime) or economy (batch/off-peak)"
    )
    visit_type: str | None = None
    intended_outcomes: str | None = None
    risk_flags: str | None = None


class RecordingCreateRequest(BaseModel):
    file_extension: str
    captured_offline: bool | None = False


class RecordingCreateResponse(BaseModel):
    id: uuid.UUID
    upload_url: str


class TranscriptionCreateResponse(BaseModel):
    id: uuid.UUID


class TranscriptionConfirmResponse(BaseModel):
    id: uuid.UUID


class TranscriptionPatchRequest(BaseModel):
    title: str | None = None
    dialogue_entries: list[DialogueEntry] | None = None
    canonical_speaker: str | None = None


class TranscriptionDialogueUpdate(BaseModel):
    dialogue_entries: list[DialogueEntry]


class TranscriptionFeedbackRequest(BaseModel):
    payload: dict
    wer: float | None = None
    der: float | None = None


class ChatCreateRequest(BaseModel):
    user_content: str


class ChatGetResponse(BaseModel):
    id: uuid.UUID
    created_datetime: datetime
    updated_datetime: datetime
    user_content: str
    assistant_content: str | None
    status: JobStatus


class ChatGetAllResponse(BaseModel):
    chat: list[ChatGetResponse]


class ChatCreateResponse(BaseModel):
    id: uuid.UUID


class GetUserResponse(BaseModel):
    id: uuid.UUID
    created_datetime: datetime
    updated_datetime: datetime
    email: str
    data_retention_days: int | None
    strict_data_retention: bool


class DataRetentionUpdateResponse(BaseModel):
    data_retention_days: int | None


class TranscriptionGetResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    dialogue_entries: list[DialogueEntry] | None
    status: JobStatus
    created_datetime: datetime
    case_reference: str | None = None
    worker_team: str | None = None
    subject_initials: str | None = None
    subject_dob: date | None = None
    processing_mode: str | None = None


class SingleRecording(BaseModel):
    id: uuid.UUID
    url: str
    extension: str


class SingleRecordingSegment(BaseModel):
    id: uuid.UUID
    url: str
    extension: str
    start_seconds: float | None = None
    end_seconds: float | None = None


class EvidenceClickRequest(BaseModel):
    recording_id: uuid.UUID
    start_time: float
    end_time: float | None = None
    citation_number: int | None = None


class MinuteListItem(BaseModel):
    id: uuid.UUID
    created_datetime: datetime
    updated_datetime: datetime
    transcription_id: uuid.UUID
    template_name: str
    agenda: str | None
    case_reference: str | None = None
    visit_type: str | None = None
    intended_outcomes: str | None = None
    risk_flags: str | None = None


class MinutesCreateRequest(BaseModel):
    template_name: str = Field(description="Name of the template to use for the minutes")
    template_id: uuid.UUID | None = Field(description="Optional id of user template")
    agenda: str | None = Field(description="The agenda for the meeting", default=None)
    visit_type: str | None = Field(default=None)
    intended_outcomes: str | None = Field(default=None)
    risk_flags: str | None = Field(default=None)


class AiEdit(BaseModel):
    instruction: str
    source_id: uuid.UUID


class MinuteVersionCreateRequest(BaseModel):
    ai_edit_instructions: AiEdit | None = Field(
        default=None,
        description="If the content source is an AI edit, store the instruction and source version id here",
    )
    content_source: ContentSource
    html_content: str = Field(default="")


class MinutesPatchRequest(BaseModel):
    html_content: str | None = None


class MinuteVersionResponse(BaseModel):
    id: uuid.UUID
    minute_id: uuid.UUID
    status: JobStatus
    created_datetime: datetime
    html_content: str
    error: str | None


class MinuteTaskCreateRequest(BaseModel):
    description: str
    owner: str | None = None
    owner_role: str | None = None
    due_date: datetime | None = None
    notes: str | None = None


class MinuteTaskPatchRequest(BaseModel):
    description: str | None = None
    owner: str | None = None
    owner_role: str | None = None
    due_date: datetime | None = None
    notes: str | None = None
    status: TaskStatus | None = None


class MinuteTaskResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    minute_id: uuid.UUID
    description: str
    status: TaskStatus
    owner: str | None = None
    owner_role: str | None = None
    due_date: datetime | None = None
    notes: str | None = None
    source: TaskSource
    planner_task_id: str | None = None
    last_synced_at: datetime | None = None
    created_datetime: datetime | None = None
    updated_datetime: datetime | None = None


class MinuteTaskListItemResponse(MinuteTaskResponse):
    case_reference: str | None = None
    template_name: str | None = None
    transcription_id: uuid.UUID | None = None
    minute_updated_datetime: datetime | None = None


class MinuteTaskPushResponse(BaseModel):
    pushed: int
    planner_task_ids: list[str]


class TaskExtractionCandidate(BaseModel):
    description: str
    owner: str | None = None
    owner_role: str | None = None
    due_date: datetime | None = None
    ai_edit_instructions: str | None
    content_source: ContentSource


class SpeakerPrediction(BaseModel):
    original_speaker: str
    predicted_name: str
    confidence: float


class SpeakerPredictionOutput(BaseModel):
    predictions: list[SpeakerPrediction]


class MinutesResponse(BaseModel):
    minutes: str


class MeetingCheck(BaseModel):
    is_long_meeting: bool


class TaskType(IntEnum):
    # messages have a natural ordering in which we want them to happen
    TRANSCRIPTION = 1
    MINUTE = 2
    EDIT = 3
    INTERACTIVE = 4
    EXPORT = 5
    TRANSLATION = 6


class EditMessageData(BaseModel):
    source_id: uuid.UUID = Field(description="ID of the source message")


class TranscriptionJobMessageData(BaseModel):
    transcription_service: str = Field(description="Name of the transcription service")
    job_name: str = Field(
        description="job name to identify asynchronous jobs. Not used in case of synchronous jobs",
        default="synchronous",
    )
    transcript: list[DialogueEntry] | None = Field(description="Transcript of the transcription", default=None)
    processing_mode: str | None = Field(default="fast")


class TranslationJobData(BaseModel):
    transcription_id: uuid.UUID
    language: str
    requested_by: uuid.UUID | None = None
    auto: bool = False


class WorkerMessage(BaseModel):
    id: uuid.UUID
    type: TaskType
    data: EditMessageData | TranscriptionJobMessageData | TranslationJobData | None = Field(default=None)
    trace_id: str | None = Field(default=None)


class LLMHallucination(BaseModel):
    hallucination_type: HallucinationType = Field(description="Type of hallucination")
    hallucination_text: str | None = Field(description="Text of hallucination", default=None)
    hallucination_reason: str | None = Field(description="Reason for hallucination", default=None)


MinuteAndHallucinations = tuple[str, list[LLMHallucination] | None]


class MeetingType(StrEnum):
    too_short = auto()
    short = auto()
    standard = auto()


class AgendaUsage(StrEnum):
    NOT_USED = auto()
    OPTIONAL = auto()
    REQUIRED = auto()


class TemplateMetadata(BaseModel):
    name: str
    description: str
    category: str
    agenda_usage: AgendaUsage
    service_domains: list[str] | None = None


class CreateQuestion(BaseModel):
    position: int
    title: str
    description: str


class Question(CreateQuestion):
    id: uuid.UUID


class PatchUserTemplateRequest(BaseModel):
    name: str | None = None
    content: str | None = None
    description: str | None = None
    questions: list[CreateQuestion | Question] | None = None


class ExportResponse(BaseModel):
    url: str
    format: str
    sharepoint_item_id: str | None = None
    planner_task_ids: list[str] | None = None


class TemplateResponse(BaseModel):
    id: uuid.UUID
    updated_datetime: datetime
    name: str
    content: str
    description: str
    type: TemplateType
    questions: list[Question] | None


class CreateUserTemplateRequest(BaseModel):
    name: str
    content: str
    description: str
    type: TemplateType
    questions: list[CreateQuestion] | None = None


class TranslationRequest(BaseModel):
    languages: list[str]
    force: bool = False


class TranslationStatusEntry(BaseModel):
    language: str
    status: JobStatus
    text: str | None = None
    updated_at: datetime | None = None
    error: str | None = None
    requested_by: uuid.UUID | None = None
    auto_requested: bool = False


class TranslationListResponse(BaseModel):
    translations: list[TranslationStatusEntry]
