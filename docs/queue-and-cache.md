# Queue and Cache Plan

## Decision

The queue implementation should be AWS SQS because the automation runtime is AWS-first and designed around queue-triggered workers, dead-letter queues, visibility timeouts, partial batch failures, and Terraform-managed AWS infrastructure.

Redis should be included in the architecture as an optional but first-class cache/coordination dependency. The first implementation can run without Redis by using database reads and constraints, but the interfaces should leave room for Redis-backed trigger caching and lightweight locks.

## Queue Abstraction

Create shared typed SQS message contracts in `packages/shared`.

```text
packages/shared/
  src/
    queue/
      automation-event.message.ts
      waiting-step.message.ts
      finished-step.message.ts
      email-tracking-event.message.ts
      webhook-delivery.message.ts
      message-version.ts
```

SQS senders/parsers should live in `apps/api` and `apps/worker` infrastructure code. They should use the message contracts from `packages/shared`.

The SQS helpers should support:

- Send one message.
- Send batch messages.
- Send FIFO message with group and dedupe keys.
- Parse records into typed messages.
- Return partial batch failures.
- Expose queue names/URLs through config.

## Default Queues

Core queues:

- `automation-events`
- `waiting-contact-workflow-steps`
- `finished-contact-workflow-steps`

Special queues:

- `workflow-emails.fifo`
- `email-tracking-events`
- `conditional-split.fifo`
- `webhook-steps.fifo`
- `webhook-deliveries`

Every production queue must have:

- DLQ.
- Configurable retention.
- Long polling.
- Visibility timeout greater than worker timeout.
- Message schema version.
- Tests for malformed and unsupported message versions.

## Redis Usage

Redis should be planned for:

- Active trigger cache by `tenantId` and event.
- Short-lived idempotency keys for high-volume event ingestion.
- Lightweight distributed locks for scheduler/workers when needed.
- Optional rate limiting or throttling state.

Redis should not be the source of truth. The database remains authoritative.

## Trigger Cache

Suggested cache key:

```text
automation:triggers:tenant:<tenantId>:event:<event>
```

Cache value:

- Trigger ID.
- Workflow ID.
- Event name.
- Filter config.
- Version or updated timestamp.

Invalidation:

- Workflow activation.
- Workflow deactivation.
- Trigger create/update/delete.
- Workflow delete.

Fallback:

- If Redis is unavailable, read active triggers from the database.
- Cache failures must not break event ingestion.

## Idempotency

Database constraints are the primary idempotency guard. Redis can reduce duplicate work, but correctness must not depend only on Redis.

Required database protections:

- Unique or conflict-safe insert for contact workflow runs where applicable.
- Unique unfinished contact workflow step record per contact workflow and workflow step.
- Transactional state changes for workflow start and step finish.

Redis idempotency keys can be used for:

```text
automation:event:<tenantId>:<contactId>:<event>:<triggerIdsHash>
automation:step:<contactWorkflowId>:<workflowStepId>
```

TTL must be short and configurable.

## Testing Support

Testing should support:

- Unit tests for message builders and parsers.
- Integration tests for SQS message shape and partial failure behavior.
- Optional Redis test instance for cache behavior.
- Database-backed fallback when Redis is disabled.
