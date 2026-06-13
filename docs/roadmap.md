# Roadmap

## Phase 0: Planning

- Define scope.
- Define architecture.
- Define data model.
- Define API surface.
- Define auth and permissions model.
- Define worker flow.
- Define frontend builder plan.
- Define Terraform plan.
- Define queue and cache plan.
- Define edge-case catalog.
- Define testing strategy.
- Define development workflow.
- Define open-source safety rules.

## Phase 1: Scaffold

- Create monorepo tooling.
- Add TypeScript config.
- Add pnpm workspace config.
- Add Turborepo task pipeline.
- Add lint/format/test setup.
- Create `apps/api` with NestJS Clean Architecture / DDD layout.
- Create `apps/web`.
- Create `apps/worker`.
- Create `packages/shared`.
- Mark `packages/shared` as private/internal.
- Add PostgreSQL + TypeORM config.
- Add queue adapter interfaces with SQS and in-memory implementations.
- Add Redis config as optional dependency with database fallback.
- Add Joi environment validation.
- Add shared Zod validation pipe.
- Add test tooling for unit, integration, worker, frontend, contract, and Terraform validation.
- Add basic CI with tests required.

## Phase 2: Core Workflow Management

- User sign up/sign in.
- Tenant CRUD.
- Tenant membership, custom roles, and modular permissions.
- Workflow CRUD.
- Trigger CRUD.
- Step CRUD.
- Step reorder.
- Exit condition management.
- Activation validation.
- Deactivation.
- Tests for all workflow management rules.

## Phase 3: Runtime Core

- Generic event ingestion.
- Trigger matching.
- Queue message contracts.
- `start-workflows`.
- `start-workflow-steps`.
- `finish-workflow-steps`.
- `watch-workflow-steps`.
- Contract tests for all queue messages.
- Worker idempotency and partial failure tests.
- Redis trigger-cache tests with database fallback behavior.

## Phase 4: Core Actions

- Delay.
- AWS SES email step.
- Email delivery, bounce, complaint, open, and click tracking.
- Attach tag.
- Detach tag.
- Unsubscribe contact.
- Delete contact.
- Conditional split.
- Webhook.
- Tests for every action and important failure path.

## Phase 5: Frontend Builder

- Workflow list.
- Workflow builder.
- Trigger forms.
- Step forms.
- Conditional split UI.
- Exit condition UI.
- Activation error display.
- Builder graph and UI tests.

## Phase 6: Terraform

- Queue modules.
- Lambda worker modules.
- Scheduler module.
- Example environment.
- Documentation for deployment.
- Terraform validation tests/checks.

## Phase 7: Public Release Readiness

- Documentation review.
- License.
- Contributing guide.
- Security policy.
- Open-source safety scan.
- Complete test suite passing in CI.
- Demo deployment guide.
