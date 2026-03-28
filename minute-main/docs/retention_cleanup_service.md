# Retention Cleanup Service - Production Implementation

## Overview

The retention cleanup service consolidates all data retention cleanup into a single scheduled job with production-grade safety guarantees:

1. **Distributed Locking**: PostgreSQL advisory locks prevent concurrent cleanup runs
2. **Storage-First Deletion**: Blobs deleted BEFORE database records to prevent orphaned storage
3. **Retry Logic**: Exponential backoff for transient storage failures
4. **Orphan Tracking**: Failed deletions logged for manual cleanup

## Architecture

### Previous Implementation (Deprecated)

```python
# ❌ OLD CODE - DO NOT USE
try:
    deletion_tasks.append(asyncio.create_task(storage_service.delete(key)))
finally:
    session.delete(recording)  # ⚠️ BUG: Always deletes DB even if blob fails!
```

**Critical Bug**: The `finally` block meant database records were deleted even when blob deletion failed, causing orphaned blobs to consume storage indefinitely.

### New Implementation

```python
# ✅ NEW CODE - PRODUCTION SAFE
# Step 1: Delete blob with retry
success, error = await delete_blob_with_retry(storage_service, blob_key)

# Step 2: Only delete DB record if blob succeeded
if success:
    session.delete(recording)
else:
    logger.error(f"ORPHANED RECORD: {recording.id} - blob failed: {error}")
```

**Fix**: Database records are only deleted after confirming blob deletion succeeded.

## Configuration

Add to `.env` or environment variables:

```bash
# Enable/disable cleanup (default: True)
RETENTION_CLEANUP_ENABLED=true

# Cleanup interval (default: 24 hours)
RETENTION_CLEANUP_INTERVAL_HOURS=24

# Lock timeout - how long to wait for lock (default: 300 seconds)
RETENTION_LOCK_TIMEOUT_SECONDS=300

# Retry configuration for blob deletion
STORAGE_DELETE_MAX_RETRIES=3
STORAGE_DELETE_RETRY_BASE_SECONDS=2.0

# Orphan threshold - flag records older than this for manual cleanup
RETENTION_ORPHAN_THRESHOLD_HOURS=72
```

## How It Works

### 1. Distributed Locking

Uses PostgreSQL advisory locks to ensure only one cleanup job runs at a time:

```python
async with advisory_lock(session, RETENTION_CLEANUP_LOCK_ID, timeout=300):
    # Critical section - only one worker can be here
    await cleanup_old_records_by_policy(session)
```

**Lock ID**: `987654321` (arbitrary unique integer for retention cleanup)

**Benefits**:
- No external Redis dependency
- Automatic lock release on process crash
- Built into PostgreSQL transaction semantics

### 2. Retry Logic with Exponential Backoff

Blob deletion retries on transient errors:

```python
@retry(
    retry=retry_if_exception_type((ServiceRequestError, ConnectionError, TimeoutError)),
    stop=stop_after_attempt(3),  # Configurable via STORAGE_DELETE_MAX_RETRIES
    wait=wait_exponential(multiplier=2, min=2, max=60),
)
async def _delete_with_retry():
    await storage_service.delete(blob_key)
```

**Retry Policy**:
- **Transient errors** (429 Too Many Requests, 503 Service Unavailable): Retry with backoff
- **Permanent errors** (403 Forbidden, 404 Not Found): No retry, fail immediately
- **Backoff timing**: 2s → 4s → 8s (configurable)

### 3. Storage-First Deletion

**Order of operations**:

```
1. Delete blob from Azure Blob Storage / S3
   ↓
2. If blob deletion succeeds ✅
   ↓
3. Delete database record
   ↓
4. Commit transaction

❌ If blob deletion fails:
   - Keep database record
   - Log as ORPHANED RECORD
   - Manual cleanup required
```

### 4. Scheduler Integration

Single consolidated job replaces previous separate jobs:

```python
scheduler.add_job(
    run_retention_cleanup_sync,
    trigger="interval",
    hours=24,  # Configurable
    id="consolidated_retention_cleanup",
    max_instances=1,  # Prevent overlapping runs
    coalesce=True,    # Combine pending runs
)
```

## Migration from Old Code

### Backend Startup

**No changes required** - `init_cleanup_scheduler()` automatically uses new code.

Old functions (`cleanup_old_records`, `cleanup_failed_records`) are deprecated but kept for backwards compatibility.

### Manual Invocation

If you manually call cleanup functions, update to:

```python
# Old (deprecated)
from common.database.postgres_database import cleanup_old_records
cleanup_old_records()

# New (recommended)
from common.services.retention_service import run_consolidated_retention_cleanup
with Session(engine) as session:
    asyncio.run(run_consolidated_retention_cleanup(session))
```

## Monitoring & Alerting

### Log Messages

**Success**:
```
INFO: === Starting consolidated retention cleanup ===
INFO: Processing 3 retention policies
INFO: Policy policy-1: Deleted 15 recordings
INFO: Data retention cleanup completed: 15 recordings deleted, 0 recordings failed
INFO: === Consolidated retention cleanup completed successfully ===
```

**Lock contention**:
```
WARNING: Skipping retention cleanup - another instance is already running
```

**Orphaned records** (requires manual cleanup):
```
ERROR: ORPHANED RECORD: Recording rec-123 blob deletion failed: Permanent error deleting blob... 
       Database record retained for manual cleanup. Blob key: recordings/2025/rec-123.wav
```

### Metrics to Track

1. **Deletion success rate**: `recordings_deleted / (recordings_deleted + recordings_failed)`
2. **Lock acquisition failures**: Count of `LockAcquisitionError`
3. **Orphaned records**: Count of "ORPHANED RECORD" log lines
4. **Cleanup duration**: Time between "Starting" and "completed" logs

### Alerts

**Critical**:
- `recordings_failed > 0` (orphaned records accumulating)
- Cleanup duration > lock timeout (indicates performance issues)

**Warning**:
- Lock acquisition failures > 3 in 24h (multiple instances competing)
- Orphaned records threshold exceeded (manual cleanup backlog)

## Testing

Run tests:

```bash
cd minute-main
poetry run pytest tests/test_retention_service.py -v
```

**Test Coverage**:
- ✅ Advisory lock acquisition and release
- ✅ Lock release on exception
- ✅ Blob deletion retry on transient errors
- ✅ Blob deletion fails permanently on auth errors
- ✅ **Database record retained when blob fails** (critical test)
- ✅ Retention policy-based cleanup
- ✅ Exponential backoff timing

## Manual Cleanup of Orphaned Records

When blob deletion fails after all retries, the database record is flagged in logs:

```
ERROR: ORPHANED RECORD: Recording 550e8400-e29b-41d4-a716-446655440000 blob deletion failed...
```

**Manual cleanup steps**:

1. **Verify blob exists**:
   ```bash
   # Azure
   az storage blob exists --account-name <account> --container-name <container> --name <blob_key>
   
   # AWS S3
   aws s3 ls s3://<bucket>/<blob_key>
   ```

2. **Delete blob manually**:
   ```bash
   # Azure
   az storage blob delete --account-name <account> --container-name <container> --name <blob_key>
   
   # AWS S3
   aws s3 rm s3://<bucket>/<blob_key>
   ```

3. **Delete database record** (after confirming blob deleted):
   ```sql
   DELETE FROM recording WHERE id = '550e8400-e29b-41d4-a716-446655440000';
   ```

## Troubleshooting

### Issue: "Failed to acquire advisory lock"

**Cause**: Another cleanup job is already running

**Solutions**:
- Wait for current job to complete (check logs)
- Increase `RETENTION_LOCK_TIMEOUT_SECONDS` if cleanup takes longer than 300s
- Check for stuck locks: `SELECT * FROM pg_locks WHERE locktype = 'advisory';`

### Issue: High rate of orphaned records

**Cause**: Persistent storage service failures

**Solutions**:
- Check Azure Blob Storage / S3 service health
- Verify service principal / IAM permissions (delete permission required)
- Check network connectivity from worker to storage
- Increase `STORAGE_DELETE_MAX_RETRIES` temporarily

### Issue: Cleanup takes too long

**Cause**: Large volume of records to process

**Solutions**:
- Reduce `RETENTION_CLEANUP_INTERVAL_HOURS` to run more frequently
- Batch deletions in smaller chunks (modify `cleanup_old_records_by_policy`)
- Consider separate cleanup jobs per policy or domain

## Production Checklist

Before deploying to production:

- [ ] Configuration added to environment (`.env` or Key Vault)
- [ ] Tests passing: `pytest tests/test_retention_service.py`
- [ ] Monitoring alerts configured for orphaned records
- [ ] Runbook created for manual cleanup procedures
- [ ] Storage service permissions verified (delete permission)
- [ ] Lock timeout set appropriately for cleanup volume
- [ ] Backup and rollback plan documented

## Support

For questions or issues:
1. Check logs for "ORPHANED RECORD" messages
2. Review Azure Blob Storage / S3 metrics for throttling
3. Verify advisory locks: `SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';`
4. Contact platform team with log excerpts and recording IDs
