# Mobile Shell (Phase 18B skeleton)

Purpose: Minimal React Native/Expo shell to consume the same tenant config and module registry as the web app. This folder stays isolated from the web build.

What exists now
- `App.tsx`: fetches tenant config, filters enabled modules via shared module registry adapter, applies shared tokens for styling, and renders a stub capture entry card.
- `theme.ts`: reuses web token map when available (fallback local copy).
- `modules.ts`: minimal module filter consistent with web registry.
- `offlineQueue.ts`: AsyncStorage-backed queue (swap to MMKV later without touching web Dexie).

How to run (local stub)
1) Ensure Node and Expo CLI are installed (`npm install -g expo`).
2) From `mobile/`, run `npm install` then `npm start` (or `npx expo start --web` for RN Web check).
3) Set `BACKEND_HOST` env var for the Expo runtime to point at the API (default http://localhost:8080).
4) Optionally set `TENANT_CONFIG_ID` env var to pick a tenant config (default `pilot_children`).
5) Run `npm run test:smoke` for a quick config-load verification (requires backend reachable).

Concurrency safety
- Mobile code lives entirely under `mobile/` and does not modify frontend/ backend files; safe to iterate in parallel with web work.
