import uuid
from contextvars import ContextVar


trace_id_ctx: ContextVar[str | None] = ContextVar("trace_id", default=None)


def set_trace_id(trace_id: str | None) -> str:
    trace = trace_id or uuid.uuid4().hex
    trace_id_ctx.set(trace)
    return trace


def get_trace_id() -> str | None:
    return trace_id_ctx.get()
