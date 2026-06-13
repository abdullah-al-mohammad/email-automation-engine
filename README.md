# Email Automation Engine

Email Automation Engine is an open-source platform for building, managing, and running event-driven email automations.

It receives events, matches workflow triggers, moves contacts through automation steps, runs delayed actions, branches on conditions, calls webhooks, and sends workflow emails through AWS SES.

## Status

This project has successfully completed its core development phases and is ready for public release. The repository contains the fully functioning architecture, API, worker, infrastructure, and front-end builder components.

See [Project Status](docs/project-status.md) for the detailed phase breakdown.

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

## Documentation

- [Contributing](CONTRIBUTING.md)
- [Open Source Scope](docs/open-source-scope.md)
- [Architecture](docs/architecture.md)
- [Data Model](docs/data-model.md)
- [API Spec](docs/api-spec.md)
- [Auth and Permissions](docs/auth-and-permissions.md)
- [Worker Flow](docs/worker-flow.md)
- [Frontend Builder](docs/frontend-builder.md)
- [Queue and Cache](docs/queue-and-cache.md)
- [Terraform](docs/terraform.md)
- [Tooling](docs/tooling.md)
- [Edge Cases](docs/edge-cases.md)
- [Testing](docs/testing.md)
- [Engineering Rules](docs/engineering-rules.md)
- [Development Workflow](docs/development-workflow.md)
- [Roadmap](docs/roadmap.md)
- [Project Status](docs/project-status.md)

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
