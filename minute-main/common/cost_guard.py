import math
import threading
from datetime import UTC, datetime, timedelta

from common.settings import get_settings

settings = get_settings()

_lock = threading.Lock()
_usage: dict[tuple[str, str], int] = {}
_reset_at = datetime.now(tz=UTC) + timedelta(days=1)


def _reset_if_needed():
    global _reset_at
    if datetime.now(tz=UTC) >= _reset_at:
        _usage.clear()
        _reset_at = datetime.now(tz=UTC) + timedelta(days=1)


def check_and_record_tokens(domain_id: str | None, model: str, prompt_chars: int) -> None:
    """Approximate token usage and enforce per-domain budgets (best-effort, in-memory)."""
    if not domain_id:
        return
    budgets = settings.LLM_TOKEN_BUDGETS_PER_DOMAIN
    if not budgets:
        return
    tokens = math.ceil(prompt_chars / 4)
    weight = settings.LLM_MODEL_COST_WEIGHTS.get(model, 1.0)
    cost_tokens = int(tokens * weight)

    key = (domain_id, model)
    with _lock:
        _reset_if_needed()
        current = _usage.get(key, 0) + cost_tokens
        budget = budgets.get(domain_id)
        if budget and current > budget:
            raise RuntimeError(f"Token budget exceeded for domain {domain_id}")
        _usage[key] = current
