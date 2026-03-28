"""Idempotency and deduplication service for worker jobs.

Provides Redis-backed idempotency checks to prevent duplicate processing
of the same job. Supports both blocking and non-blocking modes.
"""

import hashlib
import logging
from contextlib import contextmanager
from datetime import timedelta
from typing import Any
from uuid import UUID

from common.settings import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class IdempotencyService:
    """Service for preventing duplicate job processing using Redis.

    Uses Redis SET with NX (set if not exists) for atomic idempotency checks.
    Jobs are tracked by a key that includes job type and ID, with configurable TTL.
    """

    def __init__(self):
        self._redis_client = None
        self._fallback_set: set[str] = set()  # In-memory fallback when Redis unavailable

    def _get_redis_client(self):
        """Lazy initialization of Redis client."""
        if self._redis_client is None and settings.REDIS_URL:
            try:
                import redis

                self._redis_client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                )
                # Test connection
                self._redis_client.ping()
                logger.info("Idempotency service connected to Redis: %s", settings.REDIS_URL)
            except Exception:
                logger.exception("Failed to connect to Redis for idempotency. Using in-memory fallback.")
                self._redis_client = None
        return self._redis_client

    def _make_key(self, job_type: str, job_id: UUID | str, extra: str | None = None) -> str:
        """Generate a Redis key for idempotency tracking.

        Args:
            job_type: Type of job (e.g., 'transcription', 'minute_generation')
            job_id: Unique job identifier
            extra: Optional extra data to include in key (e.g., retry attempt)

        Returns:
            Redis key string
        """
        key_parts = [f"idempotency:{job_type}:{job_id}"]
        if extra:
            # Hash the extra data to keep keys reasonably sized
            extra_hash = hashlib.sha256(str(extra).encode()).hexdigest()[:16]
            key_parts.append(extra_hash)
        return ":".join(key_parts)

    def is_already_processing(
        self, job_type: str, job_id: UUID | str, extra: str | None = None, ttl_seconds: int = 3600
    ) -> bool:
        """Check if a job is already being processed.

        Args:
            job_type: Type of job (e.g., 'transcription', 'minute_generation')
            job_id: Unique job identifier
            extra: Optional extra data to include in uniqueness check
            ttl_seconds: Time-to-live for the idempotency key in seconds

        Returns:
            True if job is already processing, False if this is the first attempt
        """
        key = self._make_key(job_type, job_id, extra)
        redis_client = self._get_redis_client()

        if redis_client:
            try:
                # SET with NX (set if not exists) + EX (expiry) is atomic
                # Returns True if key was set (first time), False if already exists
                was_set = redis_client.set(key, "processing", nx=True, ex=ttl_seconds)
                return not was_set
            except Exception:
                logger.exception("Redis error checking idempotency for %s. Using fallback.", key)
                # Fall through to in-memory fallback

        # In-memory fallback (not distributed, only prevents duplicates within same process)
        if key in self._fallback_set:
            return True
        self._fallback_set.add(key)
        return False

    def mark_completed(self, job_type: str, job_id: UUID | str, extra: str | None = None) -> None:
        """Mark a job as completed and extend the idempotency window.

        Args:
            job_type: Type of job
            job_id: Unique job identifier
            extra: Optional extra data used in key
        """
        key = self._make_key(job_type, job_id, extra)
        redis_client = self._get_redis_client()

        if redis_client:
            try:
                # Extend TTL to prevent immediate reprocessing
                redis_client.setex(key, timedelta(seconds=settings.IDEMPOTENCY_COMPLETION_TTL), "completed")
                return
            except Exception:
                logger.exception("Redis error marking completion for %s", key)

        # In-memory fallback: keep in set
        self._fallback_set.add(key)

    def clear_job(self, job_type: str, job_id: UUID | str, extra: str | None = None) -> None:
        """Clear idempotency tracking for a job (used for retry after failure).

        Args:
            job_type: Type of job
            job_id: Unique job identifier
            extra: Optional extra data used in key
        """
        key = self._make_key(job_type, job_id, extra)
        redis_client = self._get_redis_client()

        if redis_client:
            try:
                redis_client.delete(key)
                return
            except Exception:
                logger.exception("Redis error clearing idempotency for %s", key)

        # In-memory fallback
        self._fallback_set.discard(key)

    @contextmanager
    def idempotent_job(self, job_type: str, job_id: UUID | str, extra: str | None = None):
        """Context manager for idempotent job execution.

        Usage:
            with idempotency_service.idempotent_job('transcription', minute_id):
                # Process job
                result = await process_transcription(minute_id)

        Yields:
            True if job should be processed, False if already processing

        Raises:
            Any exceptions from the job are re-raised after clearing idempotency
        """
        if self.is_already_processing(job_type, job_id, extra):
            logger.info("Job %s:%s is already being processed. Skipping.", job_type, job_id)
            yield False
            return

        try:
            yield True
        except Exception:
            # On failure, clear the idempotency lock so the job can be retried
            self.clear_job(job_type, job_id, extra)
            raise
        else:
            # On success, mark as completed with extended TTL
            self.mark_completed(job_type, job_id, extra)


# Global singleton instance
_idempotency_service: IdempotencyService | None = None


def get_idempotency_service() -> IdempotencyService:
    """Get the global idempotency service instance."""
    global _idempotency_service
    if _idempotency_service is None:
        _idempotency_service = IdempotencyService()
    return _idempotency_service
