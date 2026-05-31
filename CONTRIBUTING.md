# Contributing

Email Automation Engine is currently in the planning phase. Contributions should preserve the project goals: generic email automation behavior, open-source-safe naming, strong tests, and clean TypeScript architecture.

## Before Contributing

Read:

- [README](README.md)
- [Project Status](docs/project-status.md)
- [Architecture](docs/architecture.md)
- [Engineering Rules](docs/engineering-rules.md)
- [Testing](docs/testing.md)
- [Development Workflow](docs/development-workflow.md)

## Development Standards

- Use TypeScript strict mode.
- Keep public names generic and product-neutral.
- Do not include private domains, account IDs, ARNs, secrets, customer data, or proprietary product references.
- Keep controllers thin and domain logic testable.
- Add tests with every behavior change.
- Update [Project Status](docs/project-status.md) when completing or pausing implementation work.

## Change Size

Prefer small vertical changes:

- One API endpoint with tests.
- One worker behavior with tests.
- One queue contract with contract tests.
- One frontend form or graph behavior with tests.
- One Terraform module or validation improvement.

Avoid broad, untested changes across many modules.

## Pull Request Checklist

- Typecheck passes.
- Lint and format checks pass.
- Relevant unit tests pass.
- Relevant integration or contract tests pass.
- Terraform is formatted and validated when infrastructure changes.
- Documentation is updated for behavior or architecture changes.
- No private identifiers or secrets are included.
