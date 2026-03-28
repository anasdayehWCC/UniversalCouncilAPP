"""Unit tests for retry utilities."""

import asyncio
from unittest.mock import MagicMock, patch

import pytest

from common.services.retry_utils import (
    RetryExhaustedError,
    async_retry_with_backoff,
    calculate_backoff_delay,
    retry_with_backoff,
)


class TestCalculateBackoffDelay:
    """Test backoff delay calculation."""

    def test_exponential_growth(self):
        """Test that delay grows exponentially."""
        base = 2.0
        max_delay = 300.0

        delay_0 = calculate_backoff_delay(0, base, max_delay, jitter=False)
        delay_1 = calculate_backoff_delay(1, base, max_delay, jitter=False)
        delay_2 = calculate_backoff_delay(2, base, max_delay, jitter=False)

        assert delay_0 == 2.0  # 2 * 2^0
        assert delay_1 == 4.0  # 2 * 2^1
        assert delay_2 == 8.0  # 2 * 2^2

    def test_max_delay_cap(self):
        """Test that delay is capped at max_delay."""
        base = 2.0
        max_delay = 10.0

        delay_10 = calculate_backoff_delay(10, base, max_delay, jitter=False)
        assert delay_10 == max_delay

    def test_jitter_adds_randomness(self):
        """Test that jitter adds randomness to delay."""
        base = 2.0
        max_delay = 300.0

        delays = [calculate_backoff_delay(3, base, max_delay, jitter=True) for _ in range(10)]

        # All delays should be different (with high probability)
        assert len(set(delays)) > 1

        # All delays should be within ±25% of base delay
        expected = base * (2**3)  # 16.0
        for delay in delays:
            assert expected * 0.75 <= delay <= expected * 1.25


class TestRetryWithBackoff:
    """Test sync retry decorator."""

    def test_success_on_first_attempt(self):
        """Test that function succeeds on first attempt without retry."""
        mock_fn = MagicMock(return_value="success")

        @retry_with_backoff(max_retries=3)
        def test_func():
            return mock_fn()

        result = test_func()

        assert result == "success"
        assert mock_fn.call_count == 1

    def test_success_after_retry(self):
        """Test that function succeeds after retries."""
        mock_fn = MagicMock(side_effect=[ValueError("fail"), ValueError("fail"), "success"])

        @retry_with_backoff(max_retries=3, backoff_base=0.01, exceptions=(ValueError,))
        def test_func():
            return mock_fn()

        result = test_func()

        assert result == "success"
        assert mock_fn.call_count == 3

    def test_retry_exhausted(self):
        """Test that RetryExhaustedError is raised after max retries."""
        mock_fn = MagicMock(side_effect=ValueError("persistent failure"))

        @retry_with_backoff(max_retries=2, backoff_base=0.01, exceptions=(ValueError,))
        def test_func():
            return mock_fn()

        with pytest.raises(RetryExhaustedError) as exc_info:
            test_func()

        assert exc_info.value.attempts == 3  # Initial + 2 retries
        assert isinstance(exc_info.value.last_exception, ValueError)
        assert mock_fn.call_count == 3

    def test_non_retryable_exception(self):
        """Test that non-retryable exceptions are raised immediately."""
        mock_fn = MagicMock(side_effect=RuntimeError("non-retryable"))

        @retry_with_backoff(max_retries=3, exceptions=(ValueError,))
        def test_func():
            return mock_fn()

        with pytest.raises(RuntimeError):
            test_func()

        assert mock_fn.call_count == 1

    def test_on_retry_callback(self):
        """Test that on_retry callback is called before each retry."""
        mock_fn = MagicMock(side_effect=[ValueError("fail"), "success"])
        mock_on_retry = MagicMock()

        @retry_with_backoff(max_retries=3, backoff_base=0.01, exceptions=(ValueError,), on_retry=mock_on_retry)
        def test_func():
            return mock_fn()

        result = test_func()

        assert result == "success"
        assert mock_on_retry.call_count == 1
        mock_on_retry.assert_called_once()


class TestAsyncRetryWithBackoff:
    """Test async retry decorator."""

    @pytest.mark.asyncio
    async def test_async_success_on_first_attempt(self):
        """Test that async function succeeds on first attempt."""
        mock_fn = MagicMock(return_value="success")

        @async_retry_with_backoff(max_retries=3)
        async def test_func():
            return mock_fn()

        result = await test_func()

        assert result == "success"
        assert mock_fn.call_count == 1

    @pytest.mark.asyncio
    async def test_async_success_after_retry(self):
        """Test that async function succeeds after retries."""
        mock_fn = MagicMock(side_effect=[ValueError("fail"), ValueError("fail"), "success"])

        @async_retry_with_backoff(max_retries=3, backoff_base=0.01, exceptions=(ValueError,))
        async def test_func():
            return mock_fn()

        result = await test_func()

        assert result == "success"
        assert mock_fn.call_count == 3

    @pytest.mark.asyncio
    async def test_async_retry_exhausted(self):
        """Test that RetryExhaustedError is raised after max retries."""
        mock_fn = MagicMock(side_effect=ValueError("persistent failure"))

        @async_retry_with_backoff(max_retries=2, backoff_base=0.01, exceptions=(ValueError,))
        async def test_func():
            return mock_fn()

        with pytest.raises(RetryExhaustedError) as exc_info:
            await test_func()

        assert exc_info.value.attempts == 3
        assert mock_fn.call_count == 3

    @pytest.mark.asyncio
    async def test_async_with_actual_delay(self):
        """Test that async retry actually waits between attempts."""
        call_times = []

        @async_retry_with_backoff(max_retries=2, backoff_base=0.05, exceptions=(ValueError,))
        async def test_func():
            call_times.append(asyncio.get_event_loop().time())
            if len(call_times) < 3:
                raise ValueError("retry")
            return "success"

        result = await test_func()

        assert result == "success"
        assert len(call_times) == 3

        # Check that there was some delay between calls
        delay_1 = call_times[1] - call_times[0]
        delay_2 = call_times[2] - call_times[1]

        # First retry should have ~0.05s delay (with jitter ±25%)
        assert 0.03 < delay_1 < 0.1

        # Second retry should have ~0.1s delay (with jitter ±25%)
        assert 0.06 < delay_2 < 0.2
