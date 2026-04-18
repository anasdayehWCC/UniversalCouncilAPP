#!/usr/bin/env python3
"""PostToolUse hook: check for missing motion-reduce and aria-label patterns."""
import json
import subprocess
import sys

try:
    data = json.load(sys.stdin)
except (json.JSONDecodeError, EOFError):
    sys.exit(0)

tool_name = data.get("tool_name", "")
if tool_name not in ("Edit", "Write"):
    sys.exit(0)

tool_input = data.get("tool_input", {})
file_path = tool_input.get("file_path", "")

if not file_path.endswith(".tsx"):
    sys.exit(0)

warnings = []

try:
    with open(file_path, "r") as f:
        content = f.read()
        lines = content.split("\n")

    for i, line in enumerate(lines, 1):
        if "animate-spin" in line or "animate-pulse" in line:
            if "motion-reduce:" not in line and "motion-reduce:" not in (lines[i - 1] if i > 1 else ""):
                warnings.append(f"  Line {i}: animation without motion-reduce:animate-none")

        if 'size="icon"' in line or "size={'icon'}" in line or 'size="icon-sm"' in line:
            context = "\n".join(lines[max(0, i - 3) : i + 2])
            if "aria-label" not in context:
                warnings.append(f"  Line {i}: icon button may be missing aria-label")

    if warnings:
        print(f"Accessibility check for {file_path.split('/')[-1]}:")
        for w in warnings[:8]:
            print(w)
        print("See CLAUDE.md rules on motion-reduce and aria-labels")

except Exception:
    pass

sys.exit(0)
