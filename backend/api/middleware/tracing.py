import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from common.tracing import set_trace_id


class TracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        incoming = request.headers.get("traceparent") or request.headers.get("x-request-id")
        trace_id = incoming.split("-")[1] if incoming and "-" in incoming else incoming
        set_trace_id(trace_id or uuid.uuid4().hex)
        response: Response = await call_next(request)
        response.headers.setdefault("x-trace-id", set_trace_id(trace_id))
        return response
