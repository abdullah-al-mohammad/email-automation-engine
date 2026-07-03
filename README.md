# Email Automation Engine

[![CI Status](https://github.com/md-emran-hossain/email-automation-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/md-emran-hossain/email-automation-engine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-blue.svg)](https://nodejs.org)
[![Release](https://img.shields.io/badge/release-v1.0.0-blue.svg)](https://github.com/md-emran-hossain/email-automation-engine/releases)

Email Automation Engine is an open-source platform for building, managing, and running event-driven email automations.

![Workflow Builder Dashboard](docs/assets/workflow-builder.jpg)

It receives events, matches workflow triggers, moves contacts through automation steps, runs delayed actions, branches on conditions, calls webhooks, and sends workflow emails through AWS SES.

## Features

* **Drag-and-Drop Builder:** Build and organize your email journeys visually using a simple, interactive canvas.
* **Event-Driven Triggers:** Start automatically when users take actions (like sign-up or checkout) in your connected websites or applications.
* **Delays & Scheduling:** Add wait steps (hours, days, or weeks) before executing subsequent actions.
* **Conditional Branching:** Split user paths dynamically based on rules and properties.
* **Smart Email Delivery:** Send via AWS SES with built-in open, click, bounce, and spam tracking.
* **Resilient Webhooks:** Connect external APIs securely with automatic retry logic on failures.
* **Production-Ready Scale:** Built with queue-based workers to handle heavy background traffic.

## Repository Layout

```text
email-automation-engine/
  apps/
    api/        NestJS backend
    web/        React workflow builder
    worker/     TypeScript workers and Lambda handlers
  packages/
    shared/     shared contracts, schemas, and constants
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

Get a local development environment up and running in a few simple steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/md-emran-hossain/email-automation-engine.git
   cd email-automation-engine
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   _(Update `.env` with your PostgreSQL database credentials and AWS configuration if running SQS)_
4. **Run database migrations:**
   ```bash
   pnpm --filter @email-automation-engine/api migration:run
   ```
5. **Start the services in development mode:**
   ```bash
   pnpm dev
   ```

For a detailed walkthrough, SQS queues provisioning with Terraform, and configuring AWS SES, check out the full [Demo Deployment Guide](docs/demo-deployment.md).

## Documentation

**Start here:** [Architecture](docs/architecture.md) · [Data Model](docs/data-model.md) · [API Spec](docs/api-spec.md) · [Worker Flow](docs/worker-flow.md)

**Frontend & Auth:** [Frontend Builder](docs/frontend-builder.md) · [Auth and Permissions](docs/auth-and-permissions.md)

**Infrastructure:** [Terraform](docs/terraform.md) · [Queue and Cache](docs/queue-and-cache.md)

**Development:** [Contributing](CONTRIBUTING.md) · [Engineering Rules](docs/engineering-rules.md) · [Development Workflow](docs/development-workflow.md) · [Tooling](docs/tooling.md)

**Reference:** [Edge Cases](docs/edge-cases.md) · [Testing](docs/testing.md) · [Open Source Scope](docs/open-source-scope.md) · [Roadmap](docs/roadmap.md) · [Project Status](docs/project-status.md)

## Development Principles

- Keep public code and documentation product-neutral.
- Do not include private product names, domains, account IDs, ARNs, buckets, secrets, or customer data.
- Implement behavior in small, tested vertical slices.
- Keep domain logic independent from queue, cache, and cloud-provider details.
- Treat tests as required implementation artifacts, not follow-up work.
- Maintain [Project Status](docs/project-status.md) so work can resume cleanly after handoff.

## License

MIT
