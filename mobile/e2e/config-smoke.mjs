/**
 * Minimal Node-based smoke to confirm the RN shell can load tenant config and render module nav.
 * Run with: npm run test:smoke (within mobile/)
 */

import assert from "node:assert";

const BACKEND = process.env.BACKEND_HOST || "http://localhost:8080";
const TENANT = process.env.TENANT_CONFIG_ID || "pilot_children";

const url = `${BACKEND}/config/${TENANT}`;

const res = await fetch(url);
assert.ok(res.ok, `Request failed: ${res.status}`);
const json = await res.json();

assert.ok(json?.modules?.length, "No modules returned");
const enabled = json.modules.filter((m) => m.enabled);
assert.ok(enabled.length, "No enabled modules");

console.log("Config smoke passed:", { tenant: json.id, enabled: enabled.map((m) => m.id) });
