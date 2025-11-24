import json
import logging
from logging import LogRecord

from pythonjsonlogger import jsonlogger

from common.tracing import get_trace_id


class TraceIdFilter(logging.Filter):
    def filter(self, record: LogRecord) -> bool:
        record.trace_id = get_trace_id() or "unknown"
        return True


def setup_logger():
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(name)s %(levelname)s %(trace_id)s %(message)s",
        json_ensure_ascii=True,
    )
    handler.setFormatter(formatter)
    handler.addFilter(TraceIdFilter())
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers = [handler]
