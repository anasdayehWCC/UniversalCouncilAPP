# Worker Resilience: Retry, DLQ, and Idempotency

## Overview

This document describes the retry, dead-letter queue (DLQ), and idempotency mechanisms implemented for the minute-main worker to ensure production-grade resilience.

## Architecture

### Components

1. **Retry Utilities** (`common/services/retry_utils.py`)
   - Exponential backoff with jitter
   - Configurable max retries and backoff base
   - Support for both sync and async functions
   - Custom exception filtering

2. **Idempotency Service** (`common/services/idempotency_service.py`)
   - Redis-backed deduplication
   - In-memory fallback when Redis unavailable
   - Automatic lock clearing on failure
   - Context manager for clean error handling

3. **Queue Abstraction** (`common/services/queue_services/`)
   - `deadletter_message()` method for DLQ routing
   - Support for both SQS and Azure Service Bus
   - Automatic visibility timeout management

## Configuration

### Environment Variables

```bash
# Retry configuration
MAX_RETRIES=3                    # Maximum retry attempts per job
BACKOFF_BASE=2.0                 # Base delay in seconds for exponential backoff
MAX_BACKOFF_DELAY=300.0          # Maximum delay cap in seconds

# Idempotency configuration
REDIS_URL=redis://localhost:6379/0                    # Redis connection URL
IDEMPOTENCY_COMPLETION_TTL=86400                      # TTL for completed jobs (24 hours)
ENABLE_JOB_DEDUPLICATION=true                         # Enable/disable deduplication

# Queue configuration (already exists)
TRANSCRIPTION_QUEUE_NAME=transcription-queue
TRANSCRIPTION_DEADLETTER_QUEUE_NAME=transcription-dlq
LLM_QUEUE_NAME=llm-queue
LLM_DEADLETTER_QUEUE_NAME=llm-dlq
```

### Defaults

- **MAX_RETRIES**: 3 attempts (initial + 3 retries = 4 total)
- **BACKOFF_BASE**: 2.0 seconds
- **MAX_BACKOFF_DELAY**: 300.0 seconds (5 minutes)
- **IDEMPOTENCY_COMPLETION_TTL**: 86400 seconds (24 hours)
- **ENABLE_JOB_DEDUPLICATION**: true

## Job Types and Error Handling

### Transcription Jobs

**Error Scenarios:**
- Transient: API rate limits, network timeouts, temporary service unavailability
- Permanent: Invalid audio format, corrupted file, missing recording

**Handling:**
- Retry with exponential backoff for transient errors
- After max retries exhausted → send to DLQ
- Idempotency check prevents duplicate processing
- Async jobs (batch transcription) are re-queued if not ready

**Metrics:**
- `transcription_retry_total{attempt}` - Counter per retry attempt
- `transcription_dlq_total` - Counter for DLQ messages

### Minute Generation Jobs

**Error Scenarios:**
- Transient: LLM API rate limits, temporary endpoint unavailability
- Permanent: Invalid transcription data, template errors, token limit exceeded

**Handling:**
- Retry with exponential backoff
- After max retries exhausted → send to DLQ
- Idempotency prevents re-generation of same minute version

**Metrics:**
- `minute_generation_retry_total{attempt}` - Counter per retry attempt
- `minute_generation_dlq_total` - Counter for DLQ messages

### Edit/Regeneration Jobs

**Error Scenarios:**
- Transient: LLM API issues, network issues
- Permanent: Invalid source minute, malformed edit request

**Handling:**
- Retry with exponential backoff
- After max retries exhausted → send to DLQ
- Idempotency includes source minute ID in key

**Metrics:**
- `minute_edit_retry_total{attempt}` - Counter per retry attempt
- `minute_edit_dlq_total` - Counter for DLQ messages

### Export Jobs (Word, PDF)

**Error Scenarios:**
- Transient: Storage service unavailable, network issues, SharePoint API rate limits
- Permanent: Invalid minute content, corrupted template

**Handling:**
- Retry with exponential backoff
- After max retries exhausted → send to DLQ
- Idempotency prevents duplicate exports

**Metrics:**
- `export_retry_total{attempt,format}` - Counter per retry attempt and format
- `export_dlq_total{format}` - Counter for DLQ messages

### Translation Jobs

**Error Scenarios:**
- Transient: Translator API rate limits, network issues
- Permanent: Unsupported language pair, invalid translation request

**Handling:**
- ⚠️ **SPECIAL CASE**: Translation jobs are NOT sent to DLQ per AGENTS.md rule
- Retry with exponential backoff
- After max retries exhausted → complete message (log error)
- Prevents blocking main processing queue with translation failures

**Rationale:**
- Translations are optional/ancillary features
- Failure should not block core minute processing
- Auto-requested translations shouldn't fill DLQ

**Metrics:**
- `translation_retry_total{attempt,language}` - Counter per retry attempt
- `translation_failure_total{language}` - Counter for permanent failures (no DLQ)

### Interactive Chat Jobs

**Error Scenarios:**
- Transient: LLM API issues, rate limits
- Permanent: Invalid chat context, malformed query

**Handling:**
- Retry with exponential backoff
- After max retries exhausted → send to DLQ
- Idempotency prevents duplicate chat responses

**Metrics:**
- `interaction_retry_total{attempt}` - Counter per retry attempt
- `interaction_dlq_total` - Counter for DLQ messages

## Retry Logic

### Exponential Backoff Formula

```
delay = min(BACKOFF_BASE * (2 ^ attempt), MAX_BACKOFF_DELAY)
jitter = random(-25%, +25%) * delay
actual_delay = delay + jitter
```

**Example with defaults (BACKOFF_BASE=2.0s):**
- Attempt 0: ~2s (1.5s - 2.5s with jitter)
- Attempt 1: ~4s (3s - 5s with jitter)
- Attempt 2: ~8s (6s - 10s with jitter)
- Attempt 3: ~16s (12s - 20s with jitter)

### Jitter

Jitter adds ±25% randomness to prevent thundering herd when multiple jobs fail simultaneously.

## Idempotency

### Key Generation

Keys are namespaced by job type and ID:
```
idempotency:{job_type}:{job_id}[:extra_hash]
```

**Examples:**
- `idempotency:transcription:123e4567-e89b-12d3-a456-426614174000`
- `idempotency:minute_edit:456e7890-e89b-12d3-a456-426614174001:a3f2e1c8`

### TTL Management

1. **Processing TTL**: 3600s (1 hour) - default visibility timeout
2. **Completion TTL**: 86400s (24 hours) - extended after successful completion
3. **Failure Clearing**: Lock cleared immediately on failure to allow retry

### Redis Fallback

If Redis is unavailable:
- Falls back to in-memory `set()` tracking
- Not distributed (only prevents duplicates within same worker process)
- Logs warning about degraded idempotency guarantees

## DLQ Routing

### When Jobs Go to DLQ

- **After max retries exhausted**: All non-translation job types
- **Unhandled exceptions**: Jobs that fail outside retry decorator
- **Manual deadlettering**: Jobs with invalid payloads or malformed data

### Translation Exception

Per AGENTS.md rule 53:
> Add DLQ routing for non-translation worker failures.

Translation jobs complete (log error) instead of going to DLQ to prevent:
- Blocking main processing queue with optional feature failures
- Filling DLQ with auto-requested translation attempts
- Cascading failures from unsupported languages

### DLQ Message Format

DLQ messages retain original `WorkerMessage` structure:
```json
{
  "id": "uuid",
  "type": "MINUTE",
  "data": {},
  "trace_id": "optional-trace-id",
  "metadata": {
    "retry_count": 3,
    "last_error": "...",
    "timestamp": "2026-03-28T..."
  }
}
```

## Monitoring and Alerting

### Key Metrics

1. **Retry Rates**: `*_retry_total` - Track retry frequency by job type
2. **DLQ Rates**: `*_dlq_total` - Alert on elevated DLQ rates
3. **Idempotency Hits**: `idempotency_duplicate_total` - Tracks duplicate prevention
4. **Queue Depth**: Native queue metrics for main and DLQ

### Recommended Alerts

```yaml
# High retry rate (>10% of jobs require retry)
- alert: HighRetryRate
  expr: rate(transcription_retry_total[5m]) / rate(transcription_total[5m]) > 0.1

# DLQ accumulation (>5 messages/min)
- alert: DLQAccumulation
  expr: rate(transcription_dlq_total[5m]) > 5

# Redis connection failure
- alert: IdempotencyDegraded
  expr: idempotency_redis_failures_total > 0
```

## Testing

### Unit Tests

- `tests/test_retry_utils.py` - Retry decorator behavior
- `tests/test_idempotency_service.py` - Idempotency checks and Redis fallback

### Integration Tests

- `tests/integration/test_dlq_routing.py` - End-to-end DLQ routing
- Covers all job types and error scenarios
- Validates translation exception (no DLQ)

### Running Tests

```bash
# Unit tests
pytest tests/test_retry_utils.py tests/test_idempotency_service.py -v

# Integration tests
pytest tests/integration/test_dlq_routing.py -v

# Full test suite with coverage
pytest tests/ --cov=common/services --cov=worker --cov-report=html
```

## Operational Procedures

### DLQ Processing

1. **Manual inspection**:
   ```bash
   # SQS
   aws sqs receive-message --queue-url $DLQ_URL --max-number-of-messages 10

   # Azure Service Bus
   az servicebus queue message receive --queue-name $DLQ_NAME --max-message-count 10
   ```

2. **Replay logic** (when root cause fixed):
   - Purge DLQ and re-queue to main queue
   - Monitor for re-failures

3. **Permanent failures**:
   - Investigate and document in incident log
   - Purge from DLQ after resolution/decision

### Idempotency Key Management

**Clearing stuck locks**:
```bash
# Redis CLI
redis-cli DEL "idempotency:transcription:$JOB_ID"
```

**Monitoring lock duration**:
```bash
# Check TTL
redis-cli TTL "idempotency:transcription:$JOB_ID"
```

## Performance Considerations

### Backoff Impact

With defaults (MAX_RETRIES=3, BACKOFF_BASE=2.0s):
- Total retry time: ~30s (2s + 4s + 8s + 16s)
- Add job processing time for full latency

### Idempotency Overhead

- **Redis check**: <5ms per job (network RTT)
- **Fallback**: <1ms per job (in-memory set lookup)
- Negligible impact on throughput

### Queue Depth

- Retries increase queue depth temporarily
- DLQ accumulation indicates systemic issues (requires investigation)

## Future Enhancements

1. **Adaptive retry**: Adjust retry count based on error type
2. **Circuit breaker**: Stop retries during widespread outages
3. **DLQ analytics**: Automated classification of DLQ failures
4. **Replay automation**: Scheduled DLQ replay with backoff
5. **Distributed tracing**: Correlate retries across services

## References

- AGENTS.md rules 52-55 (retry, DLQ, idempotency requirements)
- `common/services/retry_utils.py` - Retry implementation
- `common/services/idempotency_service.py` - Idempotency implementation
- `worker/ray_recieve_service.py` - Worker integration
