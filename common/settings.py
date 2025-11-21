import logging
from functools import lru_cache

import dotenv
from azure.core.exceptions import ClientAuthenticationError, HttpResponseError
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from common.logger import setup_logger

setup_logger()
logger = logging.getLogger(__name__)

DOT_ENV_PATH = ".env"

dotenv_detected = dotenv.load_dotenv(dotenv_path=DOT_ENV_PATH)
if dotenv_detected:
    logger.info("A .env file was detected and loaded. Values from it will override environment variables")
else:
    logger.info("No .env file was detected. Using environment variables as is")


class Settings(BaseSettings):
    POSTGRES_HOST: str = Field(description="PostgreSQL database host")
    POSTGRES_PORT: int = Field(description="PostgreSQL database port")
    POSTGRES_DB: str = Field(description="PostgreSQL database name")
    POSTGRES_USER: str = Field(description="PostgreSQL database user")
    POSTGRES_PASSWORD: str = Field(description="PostgreSQL database password")
    POSTGRES_AUTH_MODE: str = Field(
        description='"password" (default) or "managed_identity" for Entra-based DB auth',
        default="password",
    )
    AZURE_MANAGED_IDENTITY_CLIENT_ID: str | None = Field(
        description="Optional user-assigned managed identity client ID for database auth",
        default=None,
    )
    AZURE_KEY_VAULT_URI: str | None = Field(
        description="Azure Key Vault URI when loading secrets via managed identity",
        default=None,
    )

    APP_URL: str = Field(description="used for CORS origin validation")

    # if using AWS
    AWS_ACCOUNT_ID: str | None = Field(description="AWS account ID", default=None)
    AWS_REGION: str | None = Field(description="AWS region", default=None)

    ENVIRONMENT: str = Field(
        description='use "local" for local development, or dev,preprod or prod as appropriate', default="local"
    )
    SENTRY_DSN: str | None = Field(description="Sentry DSN if using Sentry for telemetry", default=None)

    TRANSCRIPTION_QUEUE_NAME: str = Field(description="queue name to use for SQS/Azure Service Bus queues")
    TRANSCRIPTION_DEADLETTER_QUEUE_NAME: str = Field(
        description="deadletter queue name to use for SQS. Ignored if using Azure Service Bus "
    )
    LLM_QUEUE_NAME: str = Field(description="queue name to use for SQS/Azure Service Bus queues")
    LLM_DEADLETTER_QUEUE_NAME: str = Field(
        description="deadletter queue name to use for SQS. Ignored if using Azure Service Bus "
    )

    AZURE_SPEECH_KEY: str = Field(description="Azure STT speech key for API")
    AZURE_SPEECH_REGION: str = Field(description="Region for Azure STT")
    AZURE_SPEECH_API_VERSION: str = Field(
        description="Speech-to-text API version (default 2025-10-15 per latest GA)",
        default="2025-10-15",
    )
    AZURE_SPEECH_PHRASE_LIST: list[str] = Field(
        description="Optional phrase list to boost recognition (comma-separated)",
        default_factory=list,
    )
    AZURE_SPEECH_ADDITIONAL_LOCALES: list[str] = Field(
        description="Comma-separated extra locales for language ID (EAL support)",
        default_factory=list,
    )

    MAX_TRANSCRIPTION_PROCESSES: int = Field(description="the number of transcription workers per node", default=1)
    MAX_LLM_PROCESSES: int = Field(description="the number of LLM workers per node", default=1)

    # if using Azure OpenAI
    AZURE_DEPLOYMENT: str | None = Field(description="Azure deployment for openAI", default=None)
    AZURE_OPENAI_API_KEY: str | None = Field(description="Azure API key for openAI", default=None)
    AZURE_OPENAI_ENDPOINT: str | None = Field(description="Azure OpenAI service endpoint URL", default=None)
    AZURE_OPENAI_API_VERSION: str | None = Field(description="Azure OpenAI API version", default=None)

    # Microsoft Graph (SharePoint/Planner)
    MS_GRAPH_ENABLED: bool = Field(description="Enable SharePoint/Planner export uploads", default=False)
    MS_GRAPH_SITE_ID: str | None = Field(description="Graph site ID for SharePoint", default=None)
    MS_GRAPH_DRIVE_ID: str | None = Field(description="Drive ID (document library) for exports", default=None)
    MS_GRAPH_LIBRARY_PATH: str = Field(
        description="Path prefix inside the drive where exports will be uploaded",
        default="Shared Documents/Minutes",
    )
    MS_GRAPH_DOMAIN_LIBRARY_PATHS: dict[str, str] = Field(
        description="Optional per-domain library sub-path overrides keyed by service_domain_id",
        default_factory=dict,
    )
    MS_GRAPH_PLAN_ID: str | None = Field(description="Planner Plan ID for action tasks", default=None)
    MS_GRAPH_BUCKET_ID: str | None = Field(description="Planner bucket ID for action tasks", default=None)
    MS_GRAPH_DOMAIN_PLAN_IDS: dict[str, str] = Field(
        description="Optional per-domain overrides for Planner plan IDs keyed by service_domain_id",
        default_factory=dict,
    )
    MS_GRAPH_ASSIGN_USER_ID: str | None = Field(
        description="Default Entra user object ID to assign Planner tasks to when available",
        default=None,
    )
    EXPORT_URL_EXPIRY_SECONDS: int = Field(description="Expiry seconds for download URLs", default=3600)
    EXPORT_STORAGE_PREFIX: str = Field(description="Root prefix for stored export artifacts", default="exports")

    # Observability / metrics
    METRICS_ENABLED: bool = Field(description="Expose Prometheus metrics", default=True)
    METRICS_PORT: int = Field(description="Port for worker metrics server", default=9000)
    SLO_TRANSCRIPTION_P95_SECONDS: int = Field(default=900, description="P95 target for transcription+minutes")
    SLO_EXPORT_SUCCESS_RATE: float = Field(default=0.99, description="Export success target")
    SLO_OFFLINE_SYNC_SUCCESS_RATE: float = Field(default=0.99, description="Offline sync success target")

    # Cost controls
    LONG_AUDIO_BATCH_THRESHOLD_SECONDS: int = Field(default=3600, description="Switch to batch STT above this")
    LLM_TOKEN_BUDGETS_PER_DOMAIN: dict[str, int] = Field(
        description="Per-domain daily token budgets for LLM usage", default_factory=dict
    )
    LLM_MODEL_COST_WEIGHTS: dict[str, float] = Field(
        description="Relative cost weight per model for budgeting", default_factory=dict
    )

    # Entra ID / Azure AD auth
    AZURE_TENANT_ID: str | None = Field(description="Azure Entra tenant ID for JWT validation", default=None)
    AZURE_CLIENT_ID: str | None = Field(description="Azure application (client) ID expected in aud", default=None)
    AZURE_API_AUDIENCE: str | None = Field(
        description="Optional API audience override; falls back to AZURE_CLIENT_ID when unset",
        default=None,
    )

    # Local dev auth bypass guard
    DISABLE_LOCAL_FAKE_JWT: bool = Field(
        description="When true, disable the local dev fake JWT path even if ENVIRONMENT=local",
        default=False,
    )

    # if using Gemini
    GOOGLE_APPLICATION_CREDENTIALS: str | None = Field(
        description="Path to Google Cloud service account credentials JSON file", default=None
    )
    GOOGLE_CLOUD_PROJECT: str | None = Field(description="Google Cloud project ID", default=None)
    GOOGLE_CLOUD_LOCATION: str | None = Field(description="Google Cloud region/location", default=None)

    # if using LOCALSTACK for development (recommended)
    USE_LOCALSTACK: bool = Field(description="Use LocalStack for local AWS services emulation in dev", default=True)
    LOCALSTACK_URL: str = Field(
        description="LocalStack service URL for local AWS services emulation", default="http://localhost:4566"
    )

    TRANSCRIPTION_SERVICES: list[str] = Field(
        description="List of service names to use for transcription. See backend/services/transcription_services",
        default_factory=list,
    )

    FAST_LLM_PROVIDER: str = Field(
        description="Fast LLM provider to use. Currently 'openai' or 'gemini' are supported. Note that this should be "
        "used for low complexity LLM tasks, like AI edits",
        default="gemini",
    )
    FAST_LLM_MODEL_NAME: str = Field(
        description="Fast LLM model name to use. Note that this should be used for low complexity LLM tasks",
        default="gemini-2.5-flash-lite",
    )
    BEST_LLM_PROVIDER: str = Field(
        description="Best LLM provider to use. Currently 'openai' or 'gemini' are supported. Note that this should be "
        "used for higher complexity LLM tasks, like initial minute generation.",
        default="gemini",
    )
    BEST_LLM_MODEL_NAME: str = Field(
        description="Best LLM model name to use. Note that this should be used for higher complexity LLM tasks, like "
        "initial minute generation.",
        default="gemini-2.5-flash",
    )

    STORAGE_SERVICE_NAME: str = Field(
        description="Storage service type to use for file uploads. Currently supported are: s3, azure-blob",
        default="s3",
    )
    # if using s3
    DATA_S3_BUCKET: str | None = Field(description="S3 bucket name for data storage", default=None)
    # if using Azure blob
    AZURE_BLOB_CONNECTION_STRING: str | None = Field(description="Azure Blob Storage connection string", default=None)
    AZURE_UPLOADS_CONTAINER_NAME: str | None = Field(
        description="Azure container name for uploaded files", default=None
    )
    # if using azure_stt_batch
    AZURE_TRANSCRIPTION_CONTAINER_NAME: str | None = Field(
        description="Azure container name for transcription result files. Note that Azure Batch transcription requires "
        "this.",
        default=None,
    )

    QUEUE_SERVICE_NAME: str = Field(
        description="Queue service type to communicate with worker. Currently supported are: sqs, azure-service-bus",
        default="sqs",
    )
    # if using azure-service-bus
    AZURE_SB_CONNECTION_STRING: str | None = Field(description="Azure service bus connection string", default=None)

    # if running the worker inside a docker container (use "0.0.0.0" )
    RAY_DASHBOARD_HOST: str = Field(description="Ray dashboard host IP address", default="127.0.0.1")
    RAY_NAMESPACE: str = Field(description="Ray namespace for workers", default="minute")
    RAY_WORKER_REGISTER_TIMEOUT_MS: int = Field(
        description="Ray worker register timeout to avoid false-negative restarts",
        default=20000,
    )

    BETA_TEMPLATE_NAMES: list[str] = Field(
        description="List of template names available in beta. These are currently made available via a Posthog feature"
        " flag",
        default_factory=list,
    )

    # if using posthog
    POSTHOG_API_KEY: str | None = Field(description="PostHog API key for analytics", default=None)
    POSTHOG_HOST: str = Field(description="PostHog service host URL", default="https://eu.i.posthog.com")

    PII_ENCRYPTION_KEY: str | None = Field(
        description="Base64-encoded 32-byte key for Fernet encryption of sensitive fields (e.g., subject_dob)",
        default=None,
    )

    HALLUCINATION_CHECK: bool = Field(
        description="Should the LLM check for hallucinations? Note that the results of"
        " this are currently not surfaced in the UI",
        default=False,
    )

    MIN_WORD_COUNT_FOR_SUMMARY: int = Field(
        default=200, description="Transcript must have at least this many words to be passed to summary stage"
    )
    MIN_WORD_COUNT_FOR_FULL_SUMMARY: int = Field(
        default=199,
        description=(
            "Transcript must have at least this many words to be passed to complex summary stage. "
            "Note, this is disabled by default as is lower than the MIN_WORD_COUNT_FOR_SUMMARY"
        ),
    )

    LOCAL_STORAGE_PATH: str = Field(
        default="/tmp",  # noqa: S108
        description="The folder where the data directory is mounted for the local storage service.",
    )

    # use a dotenv file for local development
    if dotenv_detected:
        model_config = SettingsConfigDict(env_file=DOT_ENV_PATH, extra="ignore")


class _KeyVaultResolver:
    """Fetch secrets from Azure Key Vault when running in managed environments."""

    def __init__(self, vault_url: str, managed_identity_client_id: str | None = None):
        credential = DefaultAzureCredential(managed_identity_client_id=managed_identity_client_id)
        self._client = SecretClient(vault_url=vault_url, credential=credential)

    @lru_cache(maxsize=None)
    def get(self, secret_name: str) -> str | None:
        try:
            secret = self._client.get_secret(secret_name)
            return secret.value
        except (ClientAuthenticationError, HttpResponseError) as exc:  # pragma: no cover - network path
            logger.warning("Unable to read secret %s from Key Vault: %s", secret_name, exc)
            return None
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Unexpected error reading secret %s from Key Vault: %s", secret_name, exc)
            return None


KEY_VAULT_SECRET_MAP = {
    "POSTGRES_PASSWORD": "postgres-password",
    "AZURE_SB_CONNECTION_STRING": "servicebus-connection-string",
    "AZURE_BLOB_CONNECTION_STRING": "storage-connection-string",
    "AZURE_OPENAI_API_KEY": "openai-api-key",
    "AZURE_SPEECH_KEY": "speech-key",
}


@lru_cache(maxsize=1)
def get_settings():
    settings = Settings()  # type: ignore  # noqa: PGH003

    # Load secrets from Key Vault when running outside local dev and a vault is configured.
    if settings.ENVIRONMENT != "local" and settings.AZURE_KEY_VAULT_URI:
        resolver = _KeyVaultResolver(
            vault_url=settings.AZURE_KEY_VAULT_URI,
            managed_identity_client_id=settings.AZURE_MANAGED_IDENTITY_CLIENT_ID,
        )
        for field_name, secret_name in KEY_VAULT_SECRET_MAP.items():
            current_value = getattr(settings, field_name, None)
            if current_value:
                continue
            resolved = resolver.get(secret_name)
            if resolved:
                setattr(settings, field_name, resolved)
    return settings
