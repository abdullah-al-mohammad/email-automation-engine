# Testing Strategy

Testing is a core requirement for this project. The automation engine coordinates API validation, graph editing, queue contracts, worker idempotency, delayed execution, and infrastructure wiring. Small mismatches can create duplicate workflow runs, missed steps, or stuck contacts, so tests must be written alongside implementation.

## Goals

- Reduce behavior mismatches between API, frontend, workers, and Terraform.
- Protect workflow graph invariants.
- Catch queue message contract drift.
- Verify worker idempotency and partial failure behavior.
- Preserve strict automation behavior with product-neutral names.

## Test Types

### Unit Tests

Required for:

- Zod DTO schemas.
- Workflow activation validation.
- Trigger matching.
- Step reorder logic.
- Delay scheduling.
- Next-step resolution.
- Conditional split evaluation.
- Exit condition evaluation.
- Queue message builders.
- Graph transformation utilities.

### API Integration Tests

Required for:

- Workflow CRUD.
- Trigger CRUD.
- Step CRUD.
- Step reorder.
- Exit condition update.
- Activation/deactivation.
- Event ingestion.
- Tenant ownership checks.
- Auth guard behavior.
- Permission guard behavior.
- Tenant invitation flows.
- Active workflow immutability.

Use a test database and run migrations before integration tests.

### Worker Integration Tests

Required for:

- `start-workflows`.
- `start-workflow-steps`.
- `finish-workflow-steps`.
- `watch-workflow-steps`.
- `conditional-split`.
- `webhook-step`.
- `call-webhook`.

Workers are testable as plain functions with mocked queue adapters and real database transactions where useful.

### Contract Tests

Required for shared contracts between:

- API and frontend DTOs.
- API and worker queue messages.
- Worker-to-worker queue messages.
- Terraform queue names and runtime config keys.

Queue messages must have versioned schemas. Any breaking change requires a new message version or migration plan.

### Frontend Tests

Required for:

- Workflow builder graph rendering from API data.
- Add/delete trigger flows.
- Add/delete/update step flows.
- Conditional split branch rendering.
- Read-only active workflow state.
- Node-specific activation error display.

Use component tests for forms and graph helpers. Add end-to-end tests for the most important workflow authoring paths.

### Terraform Validation

Required checks:

- `terraform fmt`.
- `terraform validate`.
- Queue modules create DLQs.
- Lambda worker modules receive required environment variables.
- Visibility timeouts are compatible with worker timeouts.
- Example environments contain no real secrets or private identifiers.

## Behavior Acceptance

Acceptance tests define the expected automation behavior.

Acceptance areas:

- Active workflows require at least one trigger and one step.
- Active workflows are structurally read-only.
- Delay steps cannot be final steps.
- Action-specific config is required before activation.
- Trigger filters match only intended events.
- Event ingestion creates queued workflow starts only for matching active triggers.
- Workflow start creates one contact workflow run per matching trigger/workflow path.
- Step execution is idempotent.
- Finished steps route to the correct next step.
- Conditional splits route to true/false branches deterministically.
- Delayed steps resume only when due.
- Inactive workflows stop delayed continuation.
- Webhook steps finish after delivery is queued.
- Queue handlers return partial failures where supported.
- Workflow email sends are idempotent and do not duplicate SES sends on replay.
- SES delivery, bounce, and complaint notifications are stored idempotently.
- SES open events record email activity idempotently.
- SES click events record email activity without app-owned redirect logic.

## CI Requirements

Minimum CI checks:

- TypeScript typecheck.
- Lint.
- Format check.
- Unit tests.
- API integration tests.
- Worker integration tests.
- Frontend tests.
- Terraform format and validation.
- Open-source safety scan.
- GitHub Actions with PostgreSQL service containers for API integration tests.

No feature should be considered complete until tests for its domain behavior and cross-boundary contracts pass.
