# Architecture

## Monorepo Layout

```text
apps/
  api/        NestJS REST API
  web/        React workflow builder
  worker/     TypeScript queue workers and Lambda handlers
packages/
  shared/     shared contracts, Zod schemas, queue messages, and constants
infra/
  terraform/  deployable AWS infrastructure
docs/
```

## Runtime Responsibilities

### API

The API owns workflow definition and management:

- Create, read, update, delete workflows.
- Create, update, delete triggers.
- Create, update, delete steps.
- Reorder steps.
- Manage workflow exit conditions.
- Validate workflows before activation.
- Deactivate active workflows.
- Accept generic automation events.
- Accept SES tracking webhooks.
- Enqueue matching events to the workflow event queue.

The API follows a NestJS Clean Architecture / DDD layout:

```text
apps/api/src/
  infrastructure/
    config/
    database/
    decorators/
    pipes/
  modules/
    workflow/
      application/
      domain/
      infrastructure/
      interface/
      constants/
    workflow-trigger/
      application/
      domain/
      infrastructure/
      interface/
      constants/
    workflow-step/
      application/
      domain/
      infrastructure/
      interface/
      constants/
```

Each domain module keeps HTTP controllers in `interface`, use cases and services in `application`, aggregates/entities and repository contracts in `domain`, and TypeORM repository implementations in `infrastructure`.

### Web

The frontend owns workflow authoring:

- Workflow list.
- Tenant creation and management screens.
- Workflow create/edit screens.
- Visual builder.
- Trigger and step configuration forms.
- Activation/deactivation controls.
- Basic execution status views.

### Worker

The worker app owns asynchronous execution:

- Start workflows from queued events.
- Start and execute workflow steps.
- Finish workflow steps and route to the next step.
- Resume delayed steps.
- Execute specialized conditional split and webhook steps.
- Send workflow emails through AWS SES.
- Process email delivery, bounce, complaint, open, and click tracking events.

## High-Level Flow

```text
External app or API client
  -> POST /automation/events
  -> trigger matching
  -> automation-events queue
  -> start-workflows worker
  -> waiting-contact-workflow-steps queue
  -> start-workflow-steps worker
  -> action-specific queue or finished-contact-workflow-steps queue
  -> finish-workflow-steps worker
  -> next waiting step or contact workflow finished
```

## Core Design Choices

- TypeScript strict mode everywhere.
- NestJS for API structure, validation, dependency injection, and testing.
- PostgreSQL and TypeORM are the default persistence stack.
- TypeORM migrations are required; schema sync must stay disabled.
- Zod validates request DTOs through a shared Nest validation pipe.
- Joi validates environment variables at boot.
- React for frontend.
- Shared workflow constants, DTO schemas, and queue message contracts live in `packages/shared`.
- `packages/shared` is private/internal and is not published to npm.
- `packages/shared` must stay pure: no NestJS, database, AWS SDK, Redis, or dependency injection.
- Dependency injection belongs in `apps/api` and `apps/worker`, where infrastructure services are wired.
- Queue messages are versioned contracts, not ad hoc objects.
- SQS is the production queue.
- Redis is optional at runtime and reserved for trigger cache, idempotency assistance, and lightweight coordination.
- Workers are idempotent.
- State changes use transactions where consistency matters.
- Active workflows are immutable except explicit deactivation and operational metadata.
- Logs must avoid personally identifiable information.

## Deployment Model

Primary target:

- AWS Lambda workers.
- AWS SQS queues.
- EventBridge schedule for delayed steps.
- Managed relational database.
- Optional Redis cache.
- AWS SES for email delivery and SES event notifications.
