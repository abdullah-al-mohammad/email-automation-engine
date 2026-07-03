# Contributing

Email Automation Engine is open source and welcomes contributions. Contributions should preserve the project goals: product-neutral naming, strong tests, and clean TypeScript architecture.

## Before Contributing

Please read the following documents to get familiar with our setup and standards:

- [README](README.md)
- [Engineering Rules](docs/engineering-rules.md)

_Other useful references: [Architecture](docs/architecture.md), [Development Workflow](docs/development-workflow.md), [Testing](docs/testing.md), and [Project Status](docs/project-status.md)._

## How to Report Issues & Suggest Features

If you encounter a bug, have a feature request, or want to ask a question, please check the existing [GitHub Issues](https://github.com/md-emran-hossain/email-automation-engine/issues).

- **Bug Reports**: Use the Bug Report template or detail the steps to reproduce, expected behavior, and environment (Node/OS version).
- **Feature Requests**: Describe the use case and proposed solution clearly.
- **Questions/Discussions**: Open a GitHub Issue with the `question` or `discussion` tag.

## Finding an Issue to Work On

If you are looking for a place to make your first contribution, check out issues labeled [good first issue](https://github.com/md-emran-hossain/email-automation-engine/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). These tasks are self-contained and great for getting familiar with the codebase.

Alternatively, improving test coverage or documentation is always a welcomed starting point!

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

## Running Tests & Checks Locally

Before submitting a Pull Request, verify that all validation checks pass on your machine:

- **Run all unit tests:**
  ```bash
  pnpm test
  ```
- **Run integration tests:**
  ```bash
  pnpm test:integration
  ```
- **Run TypeScript type checks:**
  ```bash
  pnpm typecheck
  ```
- **Lint and format the codebase:**
  ```bash
  pnpm lint
  pnpm format
  ```

## Pull Request Checklist

- Typecheck passes (`pnpm typecheck`).
- Lint and format checks pass (`pnpm lint` & `pnpm format`).
- Relevant unit tests pass (`pnpm test`).
- Relevant integration or contract tests pass (`pnpm test:integration`).
- Terraform is formatted and validated when infrastructure changes.
- Documentation is updated for behavior or architecture changes.
- No private identifiers or secrets are included.
