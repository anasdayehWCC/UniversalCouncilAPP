# ADR 001: Platform & Repo Alignment (Modular Monolith)

**Status:** Accepted
**Date:** 2025-11-22
**Context:**
The current repository structure contains a root `packages/` directory (intended for shared platform code) and a nested `minute-main/` directory (intended for the Social Care product). However, `minute-main` currently operates as an isolated silo, containing its own `packages/` placeholders and localized UI components, duplicating or ignoring the root platform packages. This divergence threatens the "Universal Council App" vision, where multiple product modules (Social Care, Housing, etc.) share a common platform shell, config system, and design system.

**Decision:**
We will adopt a **Modular Monolith** architecture with the following structural rules:

1.  **Root `packages/*` is the Platform:**
    - The root `packages/core` and `packages/ui` are the **single source of truth** for shared logic, config schemas, module registries, and design tokens.
    - They must NOT contain product-specific business logic (e.g., "Social Care Assessment" logic belongs in a product module).

2.  **`minute-main` is a Product Module:**
    - `minute-main` represents the **Social Care Bounded Context**.
    - It must consume shared code from root `packages/*` (via workspace aliases or relative imports).
    - It must NOT maintain its own copies of core UI components or config loaders.
    - Its internal `packages/` directory is deprecated and will be removed.

3.  **Universal Shell Pattern:**
    - The root `apps/web` and `apps/mobile` act as "Universal Shells" that render **ONLY the modules and features relevant to the logged-in user's `service_domain` and `role`**.
    - **Domain Scoping:** Users NEVER see navigation for other domains:
      - Children's social worker sees ONLY children's modules/templates.
      - Adult social worker sees ONLY adult modules/templates.
      - Housing officer (future) sees ONLY housing modules/templates.
    - **Server-Side Filtering:** Navigation is filtered via `/api/modules` endpoint BEFORE being returned to the frontend, not hidden client-side.
    - `minute-main/frontend` is a specialized, product-focused shell for Social Care but should converge towards this Universal Shell architecture (Phase 21C).

**Consequences:**
- **Refactor Required:** We must refactor `minute-main/frontend` to import from `../../packages/ui` and `../../packages/core` instead of local folders.
- **Build Tooling:** We need to ensure the build system (Next.js/Turbo) correctly handles the monorepo structure and transpiles external packages.
- **De-duplication:** We will delete `minute-main/packages` and `minute-main/frontend/components/ui` (after migration).
- **Future-Proofing:** Adding a new "Housing" module will be a matter of creating a new product folder (e.g., `housing-main`) that consumes the same `packages/*`, rather than forking the entire repo.
