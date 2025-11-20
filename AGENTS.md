# AGENTS RULES (Codex / AI Assistants)

These rules govern AI-assisted changes. They balance safety, cost, and velocity.

## 1) Architecture & Abstractions

1. Use service abstractions: storage via `common/services/storage_services/`, queues via `common/services/queue_services/`, transcription via `common/services/transcription_services/`; do not call cloud SDKs directly in new code paths.
2. Templates live in `common/templates/`; register via `TemplateManager`. Do not hardcode template logic in API/worker layers.
3. Long-running work (transcription, dialogue processing, minute generation, exports) belongs in `worker/`, not in FastAPI request handlers.
4. Frontend API calls must use the generated client (`frontend/lib/api.ts`); regenerate with `npm run openapi-ts` after OpenAPI contract changes instead of hand-editing types.

## 2) Security & Auth

5. All new API routes must depend on `get_current_user` (or its successor); only `unauthorised/health` may be public.
6. Local fake JWT/middleware bypass is allowed only when `ENVIRONMENT=local`; set `DISABLE_LOCAL_FAKE_JWT=true` in any shared/dev/uat/prod environment and fail closed if invoked elsewhere.
7. Dev preview/mocks (`DEV_PREVIEW_MODE`) are permitted only in local builds and must never ship in production bundles.
8. Do not embed secrets/keys/tokens in code or prompts; read from env/secret store only.

## 3) Data & Migrations

9. Any change to `common/database/postgres_models.py` (or related schema) requires an Alembic migration under `alembic/versions/`, with backfill/seed logic for new mandatory fields.
10. New queries over org/domain-scoped data must filter by org/domain context once those columns exist; default to least privilege.

## 4) Observability & Feature Flags

11. Keep Sentry/PostHog/OTel wiring intact; propagate trace/context IDs into new async tasks and worker jobs.
12. Guard risky or high-cost paths (offline sync, economy/batch transcription, exports) behind feature flags or env toggles to allow rollback.

## 5) Frontend Workflow & UX

13. Offline/PWA state and retries belong in shared utilities (e.g., `frontend/lib/offline-queue.ts`); avoid ad-hoc storage logic.
14. UI changes must remain mobile-usable and meet basic accessibility (labels, focus, contrast); avoid desktop-only layouts for capture/review flows.
15. Preview-only UX (mock data, dummy recorder) must be gated by `DEV_PREVIEW_MODE` and disabled in prod builds.
16. **Premium UI/Theming**: All UI components must support dynamic theming via CSS variables (Tailwind v4 `@theme` directive) for WCC/RBKC branding. Avoid generic styles; use glassmorphism, subtle gradients, and high-quality transitions (framer-motion) to ensure a "premium app" feel.

## 6) Testing & Quality

16. Add/adjust tests when changing schema, business logic, templates, queue/worker flow, or auth. Use Python tests in `tests/` and Playwright (or equivalent) for critical frontend flows.
17. Keep fixtures small, synthetic, and scrubbed of PII.

## 7) Infrastructure & Config

18. `.env` is for local use only; non-local secrets must come from secret stores (e.g., Key Vault). Never hardcode prod endpoints or keys.
19. Respect regional/privacy constraints: configs must not assume non-UK regions; keep regions in config, not code; do not disable TLS/private endpoints outside local.

## 8) AI/LLM & Cost Controls

20. Prefer batch/“economy” paths and lighter models (`gpt-4o-mini`, Speech batch) for non-urgent work; document SLA/price trade-offs and provide a fallback to “fast” when needed.
21. For non-urgent LLM flows, prefer Azure OpenAI Batch API; justify premium model use for urgent paths in code comments/PR.
22. Avoid logging prompts/responses; if temporarily required for debugging, redact PII and keep disabled in production.

## 9) Storage, Retention, Secrets

23. Do not log raw PII, transcript text, or blob URLs; redact sensitive fields in any new logs.
24. If adding new artefact types, wire them into retention/cleanup (`common/database/postgres_database.py`) and ensure access is scoped by org/domain.

## 10) Code Analysis & Discovery

25. **Use MCP code-search for semantic analysis**: When analyzing code patterns, understanding implementations, or finding related functionality, prefer search_code (Gemma-powered embeddings) MCP tool over basic grep / plain grep—this; MCP code-search provides semantic search using embeddings to find functionally similar code, not just text matches.
26. **Index before searching**: Run `index_directory` on the project root before first use of `search_code`; incremental re-indexing happens automatically for stale indices (default: 5 min); supports Python, JS/TS/JSX/TSX, Svelte.
27. **Semantic queries over text patterns, Ask in natural language and filter smartly**: Use natural language queries ("user authentication flow", "error handling patterns") rather than exact string matching; and narrow results with file_patterns or chunk_type (function/class/method) to keep the embedding search focused.
28. **Find similar implementations**: After locating a reference implementation via `search_code`, use `find_similar_code` with the returned `chunk_id` to discover alternative implementations or duplicated patterns across the codebase across the repo for deeper context.

## 11) Documentation & Format

29. Keep rules numbered, one sentence each, with path references where applicable. Update this file when adding new domains/templates/feature flags or changing any rule above.
30. Always consult recent, reliable online sources before acting: if unsure about a fact, debugging issue, or determining implementation approach, run a web search and cite those sources in your reasoning or documentation.
31. Update `CHANGELOG.md` for every code, task, script, or documentation change; log the action, affected area, and purpose. Never skip this even for trivial edits.
32. Framework bumps (Next.js/React, FastAPI/Pydantic, Ray) must be recorded in ROADMAP_social_care.md and PLANS.md with the exact audit/test steps and web sources used.
33. After adopting Turbopack or typed routes, regenerate the OpenAPI client (`npm run openapi-ts`), run `next build --turbopack`, and re-check internal links/navigation with Playwright smoke tests before shipping.
34. Playwright MCP server is available (command `npx -y @executeautomation/playwright-mcp-server`, env `DEBUG=*****`, `PLAYWRIGHT_BROWSERS_PATH=*****`) with tools like `playwright_navigate`, `playwright_click`, `playwright_fill`, `playwright_screenshot`, `playwright_assert_response`, codegen lifecycle (`start_codegen_session`, `end_codegen_session`, `clear_codegen_session`, etc.) and resources `console://logs`; prefer it for browser-based e2e checks instead of ad-hoc scripting.
