# Engineering Rules

This project should preserve strict automation behavior and engineering discipline while using a clean TypeScript, NestJS, React, and AWS worker architecture. It must not depend on any private project or include private project files.

## Global Rules

- Use TypeScript strict mode everywhere.
- Use generic open-source-safe naming.
- Do not include private company names, domains, account IDs, ARNs, buckets, or secret names.
- Do not log personally identifiable information.
- Validate environment variables at startup.
- Keep shared workflow constants, DTO schemas, and queue message contracts in `packages/shared`.
- Keep `packages/shared` pure: no NestJS, database, AWS SDK, Redis, side effects, or dependency injection.
- Keep queue message contracts versioned.
- Prefer explicit domain services over controller-heavy logic.
- Tests are mandatory for every workflow behavior, queue contract, and cross-app integration.
- Reference automation behavior must be encoded as generic acceptance tests.

## Backend Rules

- Use NestJS modules by domain.
- Use Clean Architecture / DDD folder boundaries: `application`, `domain`, `infrastructure`, `interface`, and `constants`.
- Controllers handle HTTP only.
- Services own business logic.
- Use dependency injection in API modules for repositories, queues, cache, email, config, logger, and clock/time services.
- DTOs use Zod schemas with inferred TypeScript types.
- Controllers use a shared Zod validation pipe.
- Environment variables use Joi validation at boot.
- Use PostgreSQL and TypeORM by default.
- TypeORM `synchronize` must stay disabled.
- Use TypeORM `SnakeNamingStrategy`.
- Repositories isolate persistence through domain interfaces and injection tokens.
- Use camelCase property names in TypeScript code.
- Use snake_case table and column names in the database.
- Use symbol-based injection tokens in `constants/tokens.ts`.
- Activation validation must return node-specific errors when possible.
- Structural workflow changes are blocked while active.
- Tenant ownership must be checked for every referenced resource.
- Workflow validation, activation, reorder, and event ingestion require unit and integration tests.

## Worker Rules

- Workers are idempotent.
- Workers use typed message contracts.
- SQS handlers return partial batch failures.
- Use transactions for multi-row workflow state changes.
- Do not log contact emails, webhook secrets, or full payloads.
- Do not implement unnecessary manual retries; rely on queue retry and DLQ behavior.
- Keep AWS SES calls behind an email service interface.
- Use dependency injection in worker modules for repositories, SQS, Redis, SES, config, logger, and clock/time services.
- Every worker requires idempotency tests and partial failure tests.

## Frontend Rules

- Use React with TypeScript.
- Keep API types aligned with backend contracts.
- Keep graph transformation functions pure.
- Active workflows render read-only builder state.
- Node-specific validation errors should be surfaced on the graph.
- Avoid hardcoding event/action labels outside shared constants.
- Builder graph helpers and activation error rendering require tests.

## Testing Rules

- Unit tests are required for pure domain logic.
- API integration tests are required for endpoints that mutate workflow state.
- Worker integration tests are required for every queue handler.
- Contract tests are required for queue message schemas and shared DTOs.
- Frontend tests are required for workflow builder behavior.
- Terraform must pass `fmt` and `validate`.
- CI must run typecheck, lint, format check, tests, Terraform validation, and open-source safety scan.
- Do not mark a feature complete without tests for expected behavior and important failure paths.

## Terraform Rules

- Use reusable modules.
- Use configurable project/environment prefixes.
- Every queue has a DLQ.
- Lambda visibility timeout and worker timeout must be aligned.
- No hardcoded AWS account IDs, regions, backend state buckets, or private names.
- Provide examples, not production values.

## Planned Scaffolding Helpers

Create project-specific scaffolding helpers after the initial scaffold:

- `new-api-module`: scaffold NestJS module, controller, service, DTOs, tests.
- `new-worker`: scaffold typed worker handler and queue contract.
- `new-workflow-action`: add action enum, config schema, API validation, worker handler, frontend form.
- `new-migration`: create schema migration.
- `new-terraform-worker`: add Lambda and queue wiring.
- `new-test-suite`: scaffold unit, integration, contract, and worker tests for a feature.
- `review-open-source-safety`: scan for private names, secrets, and unsafe examples.
