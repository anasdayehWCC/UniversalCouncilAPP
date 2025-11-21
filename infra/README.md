# Azure UK Social Care Deployment Blueprint (Production)

## Core Platform (UK South/West only)
- **App/Worker:** Azure Container Apps (ACA) with revisions for blue/green. Ingress via App Gateway WAF; HTTP2 on.
- **Data:** Azure Database for PostgreSQL Flexible Server (zone redundant). Authentication via Entra-managed identity tokens instead of static passwords; clients pass the access token in the password field per MS guidance. citeturn0search4
- **Storage:** Azure Blob Storage (recordings, exports) with lifecycle rules for retention; private endpoints enabled.
- **Queues:** Azure Service Bus (standard/premium) for transcription + LLM queues; private endpoints; KEDA scaler on queue depth.
- **Key Vault:** Secret storage for app settings and third-party API keys; access via system-assigned identity from ACA.
- **Observability:** Log Analytics workspace + Application Insights; diagnostic settings enabled for ACA, Service Bus, Postgres, Storage.
- **Networking:** VNet with subnets for ACA, Postgres, Service Bus, Key Vault. Private DNS zones linked. No public network access on data planes (Postgres, Storage, Service Bus, KV, OpenAI/Speech).

## Environment Model
- **local:** docker-compose + LocalStack; fake JWT allowed when `ENVIRONMENT=local` and `DISABLE_LOCAL_FAKE_JWT=false`.
- **dev-preview slot:** ACA revision with mock data and relaxed auth toggled by `DEV_PREVIEW_MODE` (never enabled in prod).
- **dev → uat → prod:** separate subscriptions/resource groups; regional pairing UK South/West only.

## Auth & Secrets
- Entra ID SSO via MSAL (SPA) + Entra JWT validation in API. No secrets in code; Key Vault delivers DB/queue/storage connection strings and OpenAI/Speech keys. Postgres uses Managed Identity tokens instead of passwords. citeturn0search4

## Data Protection
- Private endpoints everywhere; TLS enforced. Blob lifecycle removes raw audio per domain policy; transcripts/minutes retention handled by scheduled cleanup job. Exports stored with time-limited SAS.

## IaC & Deployment (summary)
- Terraform stubs live in `infra/terraform/` (UK region guard, VNet, ACA env, Postgres Flexible, Service Bus, Cognitive Services OpenAI/Speech, Key Vault, Storage with lifecycle, private endpoints + private DNS). Run the guardrail script before plans: `./infra/ci/ensure_uk_region.sh uksouth`.
- Storage lifecycle JSON lives in `infra/storage_lifecycle.json` and is mirrored in the Terraform management policy for auto-deleting raw recordings after 30 days and tiering templates.
- Dev-preview slot: deploy an ACA revision flagged `dev-preview`; enable `DEV_PREVIEW_MODE=true` and expose mock data/test JWTs. Never enable in prod subscriptions.
- Pipeline shape: docker build → push to ACR → Terraform plan/apply (per env) → Alembic migrations → deploy new ACA revisions → health checks → traffic shift (blue/green) → notify.

## To Do (next phases)
- Wire Prometheus/OTel exporters and dashboards.

## Observability & SLOs
- Prometheus metrics exposed at backend `/metrics` and worker `${METRICS_PORT}` (default 9000) via `prometheus-fastapi-instrumentator` and `prometheus_client`.
- Key metrics: `transcription_latency_seconds{service,mode}`, `minute_generation_latency_seconds`, `export_status_total{status,format}`, `offline_sync_total{stage}`, `llm_tokens_total{domain,model}`. Health endpoints: `/health/live`, `/health/ready`.
- Targets: P95 transcription+minute for 60-min audio < 900s; export success > 99%; offline sync success > 99% within 2h.
- Alerts (Log Analytics/Prometheus): queue backlog, 5xx, auth failures, storage/upload errors, export failure rate >1%, offline sync stalled.

## Scale & Cost Controls
- Long audio auto-switches to batch STT when duration exceeds `LONG_AUDIO_BATCH_THRESHOLD_SECONDS` (default 3600s) if Azure Batch adapter configured.
- Per-domain LLM token budgets (env `LLM_TOKEN_BUDGETS_PER_DOMAIN`) enforced best-effort in worker; model cost weights via `LLM_MODEL_COST_WEIGHTS`.
- Sample KEDA scaler manifests in `infra/keda/queue-scaling.yaml` for Service Bus/SQS queue depth → ACA scale rules; align with ACA revisions for blue/green.
