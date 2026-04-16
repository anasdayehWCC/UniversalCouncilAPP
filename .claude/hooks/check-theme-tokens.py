#!/usr/bin/env python3
"""PostToolUse hook: warn about hardcoded colors in UI components after edits."""
import json
import re
import subprocess
import sys

HARDCODED_COLOR_PATTERN = r"(?:text|bg|border|ring|outline|shadow|divide|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+"

COMPONENT_PATHS = ("src/components/", "src/app/")

try:
    data = json.load(sys.stdin)
except (json.JSONDecodeError, EOFError):
    sys.exit(0)

tool_name = data.get("tool_name", "")
if tool_name not in ("Edit", "Write"):
    sys.exit(0)

tool_input = data.get("tool_input", {})
file_path = tool_input.get("file_path", "")

if not file_path.endswith((".tsx", ".ts")):
    sys.exit(0)

if not any(p in file_path for p in COMPONENT_PATHS):
    sys.exit(0)

try:
    result = subprocess.run(
        ["grep", "-n", "-E", HARDCODED_COLOR_PATTERN, file_path],
        capture_output=True,
        text=True,
        timeout=5,
    )
    if result.stdout.strip():
        lines = result.stdout.strip().split("\n")
        print(f"Theme token warning: {len(lines)} hardcoded color(s) in {file_path.split('/')[-1]}:")
        for line in lines[:5]:
            print(f"  {line.strip()}")
        if len(lines) > 5:
            print(f"  ... and {len(lines) - 5} more")
        print("Rule: Use semantic tokens (text-foreground, bg-card, etc.) per CLAUDE.md")
except Exception:
    pass

sys.exit(0)
