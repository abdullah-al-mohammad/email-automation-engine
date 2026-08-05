# Queue and Cache Plan

## Decision

Use **AWS SQS** for queuing. **Redis** is optional for cache and coordination; the first implementation runs without it using database reads and constraints.

## Queue Contracts

Shared, typed SQS message contracts live in `packages/shared/src/queue/` (one file per message type plus `message-version.ts`). Senders and parsers live in `apps/api` and `apps/worker` infrastructure.

Helpers:
- Send one / batch / FIFO (group + dedupe keys)
- Parse records into typed messages
- Return partial batch failures
- Expose queue names/URLs via config

## Runtime Environment

| Variable | Purpose |
| --- | --- |
| `QUEUE_TYPE` | `in-memory` (local/test) or `sqs` |
| `CACHE_TYPE` | `in-memory` (local/test) or `redis` |
| `REDIS_URL` | Required when `CACHE_TYPE=redis` |
| `AWS_REGION` | SQS region (default `us-east-1`) |
| `AWS_SQS_ENDPOINT_URL` | Optional override for local emulators |

## Queues

**Core:**
- `automation-events`
- `waiting-contact-workflow-steps`
- `finished-contact-workflow-steps`

**Special:**
- `workflow-emails.fifo`
- `email-tracking-events`
- `conditional-split.fifo`
- `webhook-steps.fifo`
- `webhook-deliveries`

Every production queue:
- DLQ
- Configurable retention
- Long polling
- Visibility timeout > worker timeout
- Message schema version
- Tests for malformed/unsupported versions

## Redis

Used for:
- Active trigger cache (keyed by `tenantId` + event)
- Short-lived idempotency keys for high-volume event ingestion
- Distributed locks
- Optional rate limiting

- Redis is **not** the source of truth; the database is authoritative.
- Trigger cache key: `automation:triggers:tenant:<tenantId>:event:<event>`, storing trigger ID, workflow ID, event name, filter config, version/timestamp.
- Invalidate on workflow activate/deactivate, trigger create/update/delete, workflow delete.
- On Redis failure, read active triggers from the database. Cache failures must not break event ingestion.

## Idempotency

Database constraints are the primary guard; Redis only reduces duplicate work. Required:
- Conflict-safe insert for workflow runs
- Unique unfinished step record per contact workflow + step
- Transactional state changes for workflow start and step finish

Optional Redis keys (`automation:event:...`, `automation:step:...`) with short, configurable TTL.

## Testing

- Unit tests for message builders/parsers
- Integration tests for SQS message shape and partial failures
- Optional Redis test instance
- Database fallback when Redis is disabled
