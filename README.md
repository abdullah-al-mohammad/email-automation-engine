# Email Automation Engine

Email Automation Engine is a planned open-source platform for building, managing, and running event-driven email automations.

It is designed for teams that need a generic email automation layer: receive events, match triggers, move contacts through automation steps, run delayed actions, branch with conditions, call webhooks, and send workflow emails through AWS SES.

## Status

This project is currently in the planning phase. The repository contains architecture, API, worker, infrastructure, testing, and contribution workflow documents. Implementation should begin only after the planning docs are reviewed and approved.

See [Project Status](docs/project-status.md) for the current phase and next task.

## Planned Features

- Workflow creation and management.
- Tenant creation and management.
- User authentication and tenant permissions.
- React workflow builder.
- Generic event ingestion.
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
- Strict test coverage for API, worker, queue contract, frontend, and infrastructure behavior.

## Planned Architecture

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

## Technology Direction

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

- Keep public code and documentation generic and open-source-safe.
- Do not include private product names, domains, account IDs, ARNs, buckets, secrets, or customer data.
- Implement behavior in small, tested vertical slices.
- Keep domain logic independent from queue, cache, and cloud-provider details.
- Treat tests as required implementation artifacts, not follow-up work.
- Maintain [Project Status](docs/project-status.md) so contributors and assisted coding sessions can resume safely.

## License

MIT
