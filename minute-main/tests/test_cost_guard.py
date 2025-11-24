import pytest

from common.cost_guard import check_and_record_tokens, _usage, _reset_if_needed


def test_token_budget_enforced(monkeypatch):
    monkeypatch.setattr("common.cost_guard.settings.LLM_TOKEN_BUDGETS_PER_DOMAIN", {"domain1": 100})
    monkeypatch.setattr("common.cost_guard.settings.LLM_MODEL_COST_WEIGHTS", {})
    _usage.clear()
    check_and_record_tokens("domain1", "gpt-4o", 200)  # ~50 tokens
    with pytest.raises(RuntimeError):
        check_and_record_tokens("domain1", "gpt-4o", 4000)  # ~1000 tokens exceeds budget


def test_reset(monkeypatch):
    monkeypatch.setattr("common.cost_guard.settings.LLM_TOKEN_BUDGETS_PER_DOMAIN", {"domainX": 10_000})
    monkeypatch.setattr("common.cost_guard.settings.LLM_MODEL_COST_WEIGHTS", {})
    _usage.clear()
    check_and_record_tokens("domainX", "gpt-4o-mini", 100)
    assert _usage
