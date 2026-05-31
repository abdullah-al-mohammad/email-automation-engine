# Development Workflow

This project should be implemented in small, well-tested increments. The workflow below is intended for all contributors, including contributors using assisted coding tools. It keeps work resumable when development stops midway and another contributor continues later.

## Core Rule

Implement small vertical slices with tests, documentation updates, and explicit completion markers. Do not generate broad untested code across many modules at once.

## Working Style

For every implementation task:

1. Read the relevant planning docs.
2. Read existing code before editing.
3. Identify the exact module boundary.
4. Add or update tests first when possible.
5. Implement the smallest complete behavior.
6. Run focused tests.
7. Update progress notes.
8. Stop only at a clean checkpoint.

## Required Progress File

Create and maintain:

```text
docs/project-status.md
```

It should contain:

- Current phase.
- Completed tasks.
- In-progress task.
- Blockers.
- Test commands last run.
- Known failing tests.
- Files touched by the current task.
- Next exact task.

Every contributor should read this file after reading `README.md`.
The file should exist from planning phase onward, even before implementation starts.

## Task Granularity

Good task size:

- One DTO and tests.
- One repository interface and implementation.
- One endpoint with service and tests.
- One queue message contract and contract tests.
- One worker behavior and tests.
- One frontend form and tests.

Bad task size:

- Build all workflow APIs.
- Build all workers.
- Build full frontend builder.
- Refactor many modules while adding a feature.

## Completion Definition

A task is complete only when:

- Tests exist for expected behavior.
- Tests exist for important failure paths.
- Typecheck passes for touched package/app.
- Lint/format passes for touched files.
- Public names are generic and open-source-safe.
- Queue/DTO contracts are versioned if applicable.
- `project-status.md` is updated.

## Resume Safety

When resuming:

- Do not assume previous work completed hidden steps.
- Check git diff/status.
- Read `project-status.md`.
- Run the narrowest relevant tests if available.
- Continue from the next exact task.
- Do not rewrite working code without a clear failing test or documented reason.

## Code Quality Guardrails

- Keep domain logic pure where possible.
- Keep controllers thin.
- Keep worker handlers as adapters around testable services.
- Avoid hidden global state.
- Avoid queue-provider-specific logic in domain services.
- Avoid Redis-only correctness.
- Avoid frontend state that diverges from API truth.
- Prefer explicit errors over silent fallbacks.

## Task Brief Checklist

Every implementation task brief should include:

- The target phase and exact task.
- Relevant docs to read.
- Expected files or module boundary.
- Tests that must be added.
- Edge cases to cover.
- Commands to run.
- Rule to update `project-status.md`.

Example:

```text
Implement workflow activation validation.
Read docs/api-spec.md, docs/edge-cases.md, docs/testing.md.
Work only in apps/api/src/modules/workflow and packages/shared.
Add unit tests for missing trigger, missing step, invalid delay final step, missing webhook URL, and cross-tenant resource reference.
Run workflow module tests and typecheck.
Update docs/project-status.md with completed task and next task.
```

## Sanity Checks Before Large Changes

Before adding a new action, worker, queue, or frontend builder behavior:

- Check whether the action enum exists in `packages/shared`.
- Check whether API validation exists.
- Check whether worker behavior exists.
- Check whether frontend form exists.
- Check whether queue message contract exists.
- Check whether Terraform needs a queue or environment variable.
- Check whether tests exist at every boundary.
