#!/usr/bin/env python3
"""PreToolUse hook: block edits to sensitive files (.env, lock files, generated code)."""
import json
import sys

BLOCKED_PATTERNS = [
    (".env.local", "Use .env.example as template; .env.local contains secrets"),
    (".env.production", "Production env files must not be edited directly"),
    ("pnpm-lock.yaml", "Lock files are auto-generated; modify package.json instead"),
    ("poetry.lock", "Lock files are auto-generated; modify pyproject.toml instead"),
    ("lib/api/generated/", "Generated API client; run 'pnpm openapi-ts' to regenerate"),
]

try:
    data = json.load(sys.stdin)
except (json.JSONDecodeError, EOFError):
    sys.exit(0)

tool_name = data.get("tool_name", "")
if tool_name not in ("Edit", "Write"):
    sys.exit(0)

tool_input = data.get("tool_input", {})
file_path = tool_input.get("file_path", "")

for pattern, reason in BLOCKED_PATTERNS:
    if pattern in file_path:
        print(f"BLOCKED: {reason}")
        print(f"File: {file_path}")
        sys.exit(2)

sys.exit(0)
