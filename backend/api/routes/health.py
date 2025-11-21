from fastapi import APIRouter, Response

health_router = APIRouter(tags=["Healthcheck"])


@health_router.get("/healthcheck")
def healthcheck():
    return Response(status_code=200)


@health_router.get("/health/live")
def health_live():
    return Response(status_code=200)


@health_router.get("/health/ready")
def health_ready():
    return Response(status_code=200)
