import time
from contextlib import asynccontextmanager
from typing import Any, Dict


class ExternalServiceUnavailable(Exception):
    """Raised when a circuit breaker is open for a dependency."""


class CircuitBreaker:
    """Lightweight, in-process circuit breaker for external dependencies.

    This is intentionally simple: it tracks failures per service name, opens the
    breaker after `failure_threshold` consecutive failures, and keeps it open
    for `reset_timeout` seconds before allowing a single trial call.
    """

    def __init__(self, failure_threshold: int = 5, reset_timeout: int = 60) -> None:
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self._state: Dict[str, Dict[str, Any]] = {}

    def _service_state(self, service: str) -> Dict[str, Any]:
        return self._state.setdefault(service, {"failures": 0, "opened_at": None, "half_open": False})

    def is_open(self, service: str) -> bool:
        state = self._service_state(service)
        if state["opened_at"] is None:
            return False
        elapsed = time.time() - state["opened_at"]
        if elapsed >= self.reset_timeout:
            # allow a half-open trial
            state["half_open"] = True
            return False
        return True

    def record_success(self, service: str) -> None:
        state = self._service_state(service)
        state["failures"] = 0
        state["opened_at"] = None
        state["half_open"] = False

    def record_failure(self, service: str) -> None:
        state = self._service_state(service)
        state["failures"] += 1
        if state["failures"] >= self.failure_threshold:
            state["opened_at"] = time.time()
            state["half_open"] = False

    @asynccontextmanager
    async def guard(self, service: str):
        """Use as: async with breaker.guard('azure_speech'): ..."""
        if self.is_open(service):
            raise ExternalServiceUnavailable(f"Circuit open for {service}")
        try:
            yield
        except Exception:
            self.record_failure(service)
            raise
        else:
            self.record_success(service)

    def snapshot(self) -> Dict[str, Any]:
        """Return a copy of breaker state for health endpoints."""
        now = time.time()
        result = {}
        for service, state in self._state.items():
            opened_at = state.get("opened_at")
            result[service] = {
                "open": self.is_open(service),
                "failures": state.get("failures", 0),
                "opened_at": opened_at,
                "seconds_open": (now - opened_at) if opened_at else 0,
                "half_open": state.get("half_open", False),
            }
        return result


# shared singleton
breaker = CircuitBreaker()
