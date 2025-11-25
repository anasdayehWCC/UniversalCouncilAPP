from fastapi import APIRouter, Response, status

from common.services.circuit_breaker import breaker

health_router = APIRouter(tags=["Healthcheck"])


@health_router.get("/healthcheck")
def healthcheck():
    return Response(status_code=200)


@health_router.get("/health/live")
def health_live():
    return {"status": "ok"}


@health_router.get("/health/ready")
def health_ready():
    snapshot = breaker.snapshot()
    degraded = any(entry.get("open") for entry in snapshot.values())
    return {
        "status": "degraded" if degraded else "ok",
        "dependencies": snapshot,
    }


@health_router.get("/health/detailed")
def health_detailed():
    """
    Returns dependency health including circuit breaker state.
    Non-critical services may report degraded without failing overall readiness.
    """
    snapshot = breaker.snapshot()
    degraded = any(entry.get("open") for entry in snapshot.values())
    status_text = "degraded" if degraded else "ok"
    return {
        "status": status_text,
        "dependencies": snapshot,
    }
