"""Retry utilities with exponential backoff for worker jobs.

Provides decorators and utilities for retrying failed worker operations
with configurable backoff strategies, max retries, and exception handling.
"""

import asyncio
import functools
import logging
import random
from typing import Any, Callable, TypeVar, cast

from common.settings import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

T = TypeVar("T")


class RetryExhaustedError(Exception):
    """Raised when max retries have been exhausted."""

    def __init__(self, attempts: int, last_exception: Exception):
        self.attempts = attempts
        self.last_exception = last_exception
        super().__init__(f"Max retries ({attempts}) exhausted. Last error: {last_exception}")


def calculate_backoff_delay(attempt: int, base: float, max_delay: float, jitter: bool = True) -> float:
    """Calculate exponential backoff delay with optional jitter.

    Args:
        attempt: Current attempt number (0-indexed)
        base: Base delay multiplier in seconds
        max_delay: Maximum delay cap in seconds
        jitter: Whether to add random jitter to prevent thundering herd

    Returns:
        Delay in seconds before next retry
    """
    delay = min(base * (2**attempt), max_delay)
    if jitter:
        # Add ±25% jitter
        jitter_range = delay * 0.25
        delay = delay + random.uniform(-jitter_range, jitter_range)  # noqa: S311
    return max(0, delay)


def retry_with_backoff(
    max_retries: int | None = None,
    backoff_base: float | None = None,
    max_delay: float = 300.0,
    exceptions: tuple[type[Exception], ...] = (Exception,),
    on_retry: Callable[[Exception, int], None] | None = None,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator for sync functions to retry with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts (defaults to settings.MAX_RETRIES)
        backoff_base: Base delay multiplier (defaults to settings.BACKOFF_BASE)
        max_delay: Maximum delay between retries in seconds
        exceptions: Tuple of exception types to catch and retry
        on_retry: Optional callback called before each retry with (exception, attempt_number)

    Returns:
        Decorated function with retry logic

    Example:
        @retry_with_backoff(max_retries=3, exceptions=(TranscriptionFailedError,))
        def fetch_transcription_result(job_id):
            return api.get_result(job_id)
    """
    _max_retries = max_retries if max_retries is not None else settings.MAX_RETRIES
    _backoff_base = backoff_base if backoff_base is not None else settings.BACKOFF_BASE

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exception: Exception | None = None

            for attempt in range(_max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < _max_retries:
                        if on_retry:
                            on_retry(e, attempt)
                        delay = calculate_backoff_delay(attempt, _backoff_base, max_delay)
                        logger.warning(
                            "Retry attempt %d/%d for %s after %.2fs due to: %s",
                            attempt + 1,
                            _max_retries,
                            func.__name__,
                            delay,
                            e,
                        )
                        import time

                        time.sleep(delay)
                    else:
                        logger.error(
                            "Max retries (%d) exhausted for %s. Last error: %s",
                            _max_retries,
                            func.__name__,
                            e,
                        )

            raise RetryExhaustedError(_max_retries + 1, cast(Exception, last_exception))

        return wrapper

    return decorator


def async_retry_with_backoff(
    max_retries: int | None = None,
    backoff_base: float | None = None,
    max_delay: float = 300.0,
    exceptions: tuple[type[Exception], ...] = (Exception,),
    on_retry: Callable[[Exception, int], None] | None = None,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator for async functions to retry with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts (defaults to settings.MAX_RETRIES)
        backoff_base: Base delay multiplier (defaults to settings.BACKOFF_BASE)
        max_delay: Maximum delay between retries in seconds
        exceptions: Tuple of exception types to catch and retry
        on_retry: Optional callback called before each retry with (exception, attempt_number)

    Returns:
        Decorated async function with retry logic

    Example:
        @async_retry_with_backoff(max_retries=3, exceptions=(TranscriptionFailedError,))
        async def process_transcription(minute_id):
            return await transcription_service.process(minute_id)
    """
    _max_retries = max_retries if max_retries is not None else settings.MAX_RETRIES
    _backoff_base = backoff_base if backoff_base is not None else settings.BACKOFF_BASE

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exception: Exception | None = None

            for attempt in range(_max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < _max_retries:
                        if on_retry:
                            on_retry(e, attempt)
                        delay = calculate_backoff_delay(attempt, _backoff_base, max_delay)
                        logger.warning(
                            "Retry attempt %d/%d for %s after %.2fs due to: %s",
                            attempt + 1,
                            _max_retries,
                            func.__name__,
                            delay,
                            e,
                        )
                        await asyncio.sleep(delay)
                    else:
                        logger.error(
                            "Max retries (%d) exhausted for %s. Last error: %s",
                            _max_retries,
                            func.__name__,
                            e,
                        )

            raise RetryExhaustedError(_max_retries + 1, cast(Exception, last_exception))

        return wrapper

    return decorator
