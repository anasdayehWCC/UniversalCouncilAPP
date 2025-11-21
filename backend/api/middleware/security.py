import time
from collections import defaultdict, deque
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        response = await call_next(request)
        response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Cache-Control", "no-store")
        return response


class SimpleRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 120, window_seconds: int = 60, protected_paths: list[str] | None = None):
        super().__init__(app)
        self.limit = limit
        self.window = window_seconds
        self.hits: dict[str, deque] = defaultdict(deque)
        self.protected_paths = protected_paths or []

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        path = request.url.path
        if not any(path.startswith(p) for p in self.protected_paths):
            return await call_next(request)

        ip = request.client.host if request.client else "unknown"
        now = time.time()
        dq = self.hits[ip]
        while dq and dq[0] < now - self.window:
            dq.popleft()
        if len(dq) >= self.limit:
            return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
        dq.append(now)
        return await call_next(request)


class OriginCheckMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, allowed_origins: list[str]):
        super().__init__(app)
        self.allowed_origins = allowed_origins

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        if request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"}:
            origin = request.headers.get("origin") or request.headers.get("referer", "")
            if origin and not any(origin.startswith(o) for o in self.allowed_origins):
                return JSONResponse(status_code=403, content={"detail": "Invalid origin"})
        return await call_next(request)
