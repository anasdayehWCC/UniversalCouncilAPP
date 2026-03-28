# Universal Council App

A multi-tenant SaaS platform for UK local government social care that enables recording, transcription, and management of case meeting minutes.

This directory is the canonical web frontend inside the root `UniversalCouncilAPP` repository. Use the root pnpm workspace for installs and verification, and treat the root [`CHANGELOG.md`](../CHANGELOG.md) as the only authoritative changelog.

## Documentation

| Document | Description |
|----------|-------------|
| [**API Documentation**](docs/API.md) | Complete API reference with endpoints, authentication, error handling, and rate limiting |
| [**Architecture**](docs/ARCHITECTURE.md) | System architecture, design patterns, state management, and data flow diagrams |
| [**Components**](docs/COMPONENTS.md) | UI component library documentation |
| [**Hooks**](docs/HOOKS.md) | Custom React hooks reference |
| [**Getting Started**](docs/GETTING_STARTED.md) | Setup and development guide |

## Quick Start

```bash
# Install dependencies from the repo root
cd ..
pnpm install

# Run the canonical web frontend
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Node requirement**: This project targets Node.js 20.9.0+ (see `.nvmrc`).

## Project Structure

```
universal-app/
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries (API, auth, offline)
│   ├── providers/      # Context providers
│   ├── config/         # Configuration files
│   └── types/          # TypeScript types
├── public/             # Static assets (PWA, icons)
└── docs/               # Documentation
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 + Radix UI
- **Auth**: Azure Entra ID (MSAL)
- **Data**: TanStack Query + IndexedDB (offline)
- **Observability**: Sentry + PostHog

## Project Navigation

| Resource | Purpose |
|----------|---------|
| [`../AGENTS.md`](../AGENTS.md) | Root repo rules and architecture guardrails |
| [`AGENTS.md`](AGENTS.md) | Frontend-local supplement for `universal-app/` |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Canonical root change log |
| [`ROLE_MATRIX.md`](ROLE_MATRIX.md) | Persona/role permissions |
| [`minute-main/ROADMAP_social_care.md`](minute-main/ROADMAP_social_care.md) | Roadmap and phase tracking |

## Environment Variables

```env
# Azure Entra ID
NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3000

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8080
BACKEND_URL=http://localhost:8080

# Demo Mode (bypasses Azure auth)
NEXT_PUBLIC_DEMO_MODE=true
```

## Demo API contract
The demo exposes `/api/demos/personas` (Next.js route group) to centralize the persona, meeting, and template snapshots used by `DemoContext`. Keeping this shape documented helps avoid mismatches between the JSON payload and the TS types in `src/types/demo.ts`.

```ts
interface PersonaSnapshot {
  personas: Record<string, {
    id: string;
    name: string;
    role: 'social_worker' | 'manager' | 'admin' | 'housing_officer';
    domain: 'children' | 'adults' | 'housing' | 'corporate';
    team: string;
    avatar: string;
    email: string;
    authorityLabel?: string;
    focusArea?: string;
    functionLabel?: string;
    pilotFlags?: Array<'smartCapture' | 'aiInsights' | 'housingPilot'>;
    pilotLabel?: string;
  }>;
  meetings: Meeting[]; // shape defined in src/types/demo.ts (status, timestamps, templateId, domain, tags, tasks, etc.)
  templates: Template[]; // `id`, `name`, `description`, `sections`, `domain`, `icon`
  generatedAt: string; // ISO timestamp of the snapshot
 }
```

The route is `force-static` with `revalidate = 0` so it can be fetched instantly by the client (DemoProvider hydrates on mount) while still being statically generated in dev builds. Update this contract whenever the demo shapes evolve (e.g., new persona fields, template sections, or meeting metadata). Document any changes in the root `CHANGELOG.md` and align them with `src/types/demo.ts`.
