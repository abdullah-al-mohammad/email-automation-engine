# Email Automation Engine

Email Automation Engine is an open-source platform for building, managing, and running event-driven email automations.

It receives events, matches workflow triggers, moves contacts through automation steps, runs delayed actions, branches on conditions, calls webhooks, and sends workflow emails through AWS SES.

## Status

Phases 1–6 are complete. Phase 7 (Public Release Readiness) is in progress — integration tests are being finalised and a few production-readiness checks remain before v1.0.0.

See [Project Status](docs/project-status.md) for the full phase breakdown.

## Features

- Workflow creation and management.
- Tenant creation and management.
- User authentication and tenant permissions.
- React workflow builder.
- Event ingestion.
- Trigger matching.
- Workflow activation validation.
- Queue-driven workflow execution.
- Delay steps and scheduled continuation.
- Conditional split steps.
- Webhook steps and delivery retries.
- AWS SES workflow email step.
- SES delivery/bounce/complaint tracking.
- SES open and click tracking.
- PostgreSQL persistence with TypeORM.
- Optional Redis cache and coordination layer.
- AWS SQS/Lambda deployment with Terraform.
- Required test coverage for API, worker, queue contract, frontend, and infrastructure behavior.

## Repository Layout

```text
email-automation-engine/
  apps/
    api/        NestJS backend
    web/        React workflow builder
    worker/     TypeScript workers and Lambda handlers
  packages/
    shared/     private workspace package for shared contracts, schemas, and constants
  infra/
    terraform/  AWS infrastructure modules and examples
  docs/
```

## Technology

- **Language:** TypeScript.
- **Runtime:** Node.js 24.
- **Package manager:** pnpm.
- **Monorepo tasks:** Turborepo.
- **Backend:** NestJS with Clean Architecture / DDD module boundaries.
- **Database:** PostgreSQL with TypeORM migrations.
- **Validation:** Zod for DTOs, Joi for environment validation.
- **Frontend:** React.
- **Frontend UI:** Tailwind CSS, shadcn/ui, React Flow, TanStack Query, React Hook Form, and Zod.
- **Workers:** TypeScript workers deployable as AWS Lambda handlers.
- **Queues:** AWS SQS.
- **Cache:** Optional Redis for trigger cache, idempotency assistance, and lightweight coordination.
- **Infrastructure:** Terraform.
- **CI:** GitHub Actions with PostgreSQL service containers.

## Getting Started

To run a local or AWS demo instance, follow the [Demo Deployment Guide](docs/demo-deployment.md).

It covers:

- Provisioning SQS queues with Terraform
- Running PostgreSQL locally with Docker
- Starting the API, worker, and web dashboard

## Documentation

**Start here:** [Architecture](docs/architecture.md) · [Data Model](docs/data-model.md) · [API Spec](docs/api-spec.md) · [Worker Flow](docs/worker-flow.md)

**Frontend & Auth:** [Frontend Builder](docs/frontend-builder.md) · [Auth and Permissions](docs/auth-and-permissions.md)

**Infrastructure:** [Terraform](docs/terraform.md) · [Queue and Cache](docs/queue-and-cache.md)

**Development:** [Contributing](CONTRIBUTING.md) · [Engineering Rules](docs/engineering-rules.md) · [Development Workflow](docs/development-workflow.md) · [Tooling](docs/tooling.md)

**Reference:** [Edge Cases](docs/edge-cases.md) · [Testing](docs/testing.md) · [Open Source Scope](docs/open-source-scope.md) · [Roadmap](docs/roadmap.md) · [Project Status](docs/project-status.md)

## Workspace Package

`packages/shared` is a private monorepo workspace package for internal code sharing between the API, web app, and workers. It is not planned for npm publishing.

## Development Principles

- Keep public code and documentation product-neutral.
- Do not include private product names, domains, account IDs, ARNs, buckets, secrets, or customer data.
- Implement behavior in small, tested vertical slices.
- Keep domain logic independent from queue, cache, and cloud-provider details.
- Treat tests as required implementation artifacts, not follow-up work.
- Maintain [Project Status](docs/project-status.md) so work can resume cleanly after handoff.

## License

MIT
