# Quick Reference: Worker Resilience

## Adding Retry to New Worker Functions

### Async Functions

```python
from common.services.retry_utils import async_retry_with_backoff
from common.services.exceptions import YourCustomError

@async_retry_with_backoff(
    max_retries=3,  # Optional, defaults to settings.MAX_RETRIES
    backoff_base=2.0,  # Optional, defaults to settings.BACKOFF_BASE
    max_delay=300.0,  # Optional, defaults to settings.MAX_BACKOFF_DELAY
    exceptions=(YourCustomError, TimeoutError),  # Which exceptions to retry
)
async def process_new_job(job_id: UUID):
    # Your processing logic
    result = await some_api_call(job_id)
    return result
```

### Sync Functions

```python
from common.services.retry_utils import retry_with_backoff

@retry_with_backoff(
    max_retries=3,
    exceptions=(ConnectionError, TimeoutError),
)
def fetch_external_data(url: str):
    response = requests.get(url)
    return response.json()
```

### With Retry Callback

```python
def log_retry_attempt(exception: Exception, attempt: int):
    logger.warning(f"Retry attempt {attempt + 1} due to: {exception}")

@async_retry_with_backoff(
    max_retries=5,
    on_retry=log_retry_attempt,
)
async def flaky_operation():
    # Your code
    pass
```

## Adding Idempotency Checks

### Using Context Manager (Recommended)

```python
from common.services.idempotency_service import get_idempotency_service

idempotency_service = get_idempotency_service()

async def process_job(job_type: str, job_id: UUID):
    with idempotency_service.idempotent_job(job_type, job_id) as should_process:
        if not should_process:
            logger.info(f"Job {job_id} already processing. Skipping.")
            return
        
        # Your processing logic
        result = await do_work(job_id)
        
        # On success, automatically marks as completed
        # On exception, automatically clears lock for retry
        return result
```

### Manual Control

```python
idempotency_service = get_idempotency_service()

# Check if already processing
if idempotency_service.is_already_processing("my_job_type", job_id):
    logger.info("Job already processing")
    return

try:
    # Process job
    result = process_job(job_id)
    
    # Mark as completed (extends TTL)
    idempotency_service.mark_completed("my_job_type", job_id)
    
except Exception:
    # Clear lock to allow retry
    idempotency_service.clear_job("my_job_type", job_id)
    raise
```

### With Extra Context

For jobs that need more than just an ID for uniqueness:

```python
# Example: Edit job that depends on both target and source
extra_context = f"source:{source_id}"
with idempotency_service.idempotent_job("edit", target_id, extra=extra_context):
    # Process edit
    pass
```

## Integrating with Queue Worker

### Standard Pattern

```python
async def process_task(message: WorkerMessage, receipt_handle: Any) -> None:
    # 1. Check idempotency (if enabled)
    if settings.ENABLE_JOB_DEDUPLICATION:
        if idempotency_service.is_already_processing("task_type", message.id):
            logger.info("Task %s already processing. Skipping.", message.id)
            queue_service.complete_message(receipt_handle)
            return
    
    try:
        logger.info("Processing task %s", message.id)
        
        # 2. Process with retry
        await _process_with_retry(message.id)
        
        # 3. Mark as completed (idempotency)
        if settings.ENABLE_JOB_DEDUPLICATION:
            idempotency_service.mark_completed("task_type", message.id)
    
    except RetryExhaustedError as e:
        # 4. Send to DLQ after max retries
        logger.error("Task %s failed after %d attempts. Sending to DLQ.", message.id, e.attempts)
        queue_service.deadletter_message(message, receipt_handle)
        if settings.ENABLE_JOB_DEDUPLICATION:
            idempotency_service.clear_job("task_type", message.id)
    
    except YourKnownError:
        # 5. Handle known errors (complete without DLQ)
        logger.exception("Known error for task %s", message.id)
        queue_service.complete_message(receipt_handle)
        if settings.ENABLE_JOB_DEDUPLICATION:
            idempotency_service.clear_job("task_type", message.id)
    
    else:
        # 6. Complete message on success
        queue_service.complete_message(receipt_handle)

@async_retry_with_backoff(
    max_retries=settings.MAX_RETRIES,
    backoff_base=settings.BACKOFF_BASE,
    max_delay=settings.MAX_BACKOFF_DELAY,
    exceptions=(YourRetryableError, Exception),
)
async def _process_with_retry(task_id: UUID):
    """Process task with automatic retry logic."""
    await YourService.process(task_id)
```

## Exception Handling Guidelines

### Retryable vs Non-Retryable Exceptions

**Retryable (temporary failures):**
- `ConnectionError`, `TimeoutError` - Network issues
- `RateLimitError` - API rate limits
- `ServiceUnavailableError` - Upstream service down
- Generic `Exception` when unknown

**Non-Retryable (permanent failures):**
- `ValidationError` - Invalid input data
- `NotFoundError` - Resource doesn't exist
- `AuthenticationError` - Invalid credentials
- `ValueError` - Logic error in code

### Translation Jobs Exception

Translation jobs are a special case - they retry but don't go to DLQ:

```python
async def process_translation_task(message: WorkerMessage, receipt_handle: Any) -> None:
    try:
        await _process_translation_with_retry(message.data)
    except RetryExhaustedError as e:
        # Translation jobs DON'T go to DLQ - just log and complete
        logger.error(
            "Translation failed after %d attempts. Completing (no DLQ).",
            e.attempts
        )
        queue_service.complete_message(receipt_handle)
    except Exception:
        logger.exception("Translation failed")
        queue_service.complete_message(receipt_handle)
    else:
        queue_service.complete_message(receipt_handle)
```

## Configuration

### Environment Variables

```bash
# Retry configuration
MAX_RETRIES=3                    # Number of retry attempts
BACKOFF_BASE=2.0                 # Base delay in seconds
MAX_BACKOFF_DELAY=300.0          # Maximum delay cap (5 minutes)

# Idempotency configuration
REDIS_URL=redis://localhost:6379/0                    # Redis connection
IDEMPOTENCY_COMPLETION_TTL=86400                      # 24 hours
ENABLE_JOB_DEDUPLICATION=true                         # Enable feature

# Queue configuration
TRANSCRIPTION_DEADLETTER_QUEUE_NAME=transcription-dlq
LLM_DEADLETTER_QUEUE_NAME=llm-dlq
```

### Local Development Without Redis

If `REDIS_URL` is not set, idempotency automatically falls back to in-memory tracking:

```python
# Works without Redis configured
idempotency_service = get_idempotency_service()

# Falls back to in-memory set() - logs warning
is_processing = idempotency_service.is_already_processing("job", job_id)
```

**Note**: In-memory fallback is not distributed - only prevents duplicates within the same worker process.

## Monitoring

### Logging

All retry attempts are automatically logged:

```
WARNING: Retry attempt 1/3 for process_transcription after 2.15s due to: ConnectionError(...)
WARNING: Retry attempt 2/3 for process_transcription after 4.32s due to: ConnectionError(...)
ERROR: Max retries (3) exhausted for process_transcription. Last error: ConnectionError(...)
```

### Metrics (Future)

Recommended Prometheus metrics:

```python
from prometheus_client import Counter

retry_counter = Counter(
    'worker_retry_total',
    'Total retry attempts',
    ['job_type', 'attempt']
)

dlq_counter = Counter(
    'worker_dlq_total',
    'Total DLQ messages',
    ['job_type']
)

idempotency_counter = Counter(
    'worker_idempotency_duplicate_total',
    'Total duplicate jobs prevented',
    ['job_type']
)
```

## Testing

### Testing Retry Logic

```python
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_retry_succeeds_after_failure():
    mock_service = AsyncMock(side_effect=[
        ValueError("first attempt fails"),
        "success"
    ])
    
    @async_retry_with_backoff(max_retries=2, backoff_base=0.01)
    async def test_function():
        return await mock_service()
    
    result = await test_function()
    
    assert result == "success"
    assert mock_service.call_count == 2
```

### Testing Idempotency

```python
def test_idempotency_prevents_duplicate():
    service = IdempotencyService()
    job_id = uuid.uuid4()
    
    # First check - not processing
    assert service.is_already_processing("test", job_id) is False
    
    # Second check - already processing
    assert service.is_already_processing("test", job_id) is True
```

## Troubleshooting

### Jobs Stuck in Processing

Check Redis for stuck locks:

```bash
# List all idempotency keys
redis-cli KEYS "idempotency:*"

# Check TTL of a key
redis-cli TTL "idempotency:transcription:123e4567-e89b-12d3-a456-426614174000"

# Manually clear a stuck lock
redis-cli DEL "idempotency:transcription:123e4567-e89b-12d3-a456-426614174000"
```

### DLQ Messages Not Routing

1. Check queue configuration:
   ```python
   # Verify DLQ queue names are set
   assert settings.TRANSCRIPTION_DEADLETTER_QUEUE_NAME
   assert settings.LLM_DEADLETTER_QUEUE_NAME
   ```

2. Check queue service implementation has `deadletter_message()`:
   ```python
   queue_service.deadletter_message(message, receipt_handle)
   ```

3. Check exception handling catches `RetryExhaustedError`:
   ```python
   except RetryExhaustedError as e:
       # Should call deadletter_message here
       queue_service.deadletter_message(message, receipt_handle)
   ```

### Redis Connection Issues

Idempotency service automatically falls back to in-memory tracking:

```
WARNING: Failed to connect to Redis for idempotency. Using in-memory fallback.
WARNING: Redis error checking idempotency for idempotency:test:123. Using fallback.
```

**Implications:**
- Deduplication still works within same worker process
- No distributed deduplication across multiple worker instances
- No persistence across worker restarts

## Best Practices

1. **Always specify exception types for retry**: Don't catch all exceptions blindly
2. **Use idempotency for all user-facing operations**: Prevents duplicate charges, emails, etc.
3. **Set appropriate backoff delays**: Balance between retry speed and API rate limits
4. **Monitor DLQ accumulation**: Set up alerts for >5 messages/min
5. **Test retry logic**: Ensure it handles both transient and permanent failures
6. **Document error scenarios**: Update worker_resilience.md when adding new job types
7. **Use context managers**: Prefer `idempotent_job()` context manager over manual control

## See Also

- [Worker Resilience Documentation](./worker_resilience.md) - Comprehensive guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY_worker_resilience.md) - What was implemented
- `common/services/retry_utils.py` - Retry implementation
- `common/services/idempotency_service.py` - Idempotency implementation
- `tests/test_retry_utils.py` - Retry tests
- `tests/test_idempotency_service.py` - Idempotency tests
