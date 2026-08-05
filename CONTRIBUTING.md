# Contributing

Thanks for taking the time to contribute! This guide covers how to report issues, suggest features, and submit code changes.

## Ways to Contribute

- **Report a bug** — Open an [issue](https://github.com/md-emran-hossain/email-automation-engine/issues) with steps to reproduce, expected behavior, and your environment (Node/OS versions).
- **Suggest a feature** — Describe the use case and the proposed solution in an issue.
- **Ask a question** — Open an issue tagged `question` or `discussion`.
- **Submit code** — See [Getting Started](#getting-started) below.

## Getting Started

1. Find an issue labeled [good first issue](https://github.com/md-emran-hossain/email-automation-engine/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22), or open one first to discuss your change.
2. Fork the repository and create a branch for your change.
3. Make your change as a small, tested vertical slice.
4. Run the checks below and open a Pull Request.

## Development Setup

Install dependencies with [pnpm](https://pnpm.io) (Node >= 24):

```bash
pnpm install
```

Run the app in development:

```bash
pnpm dev
```

## Checks

Before submitting a Pull Request, verify everything passes locally:

- **Unit tests:** `pnpm test`
- **Integration tests:** `pnpm test:integration`
- **Type checks:** `pnpm typecheck`
- **Lint:** `pnpm lint`
- **Format:** `pnpm format`

## Coding Standards

- Use TypeScript strict mode.
- Keep public names generic and product-neutral.
- Do not include private domains, account IDs, ARNs, secrets, customer data, or proprietary product references.
- Keep controllers thin and domain logic testable.
- Add tests with every behavior change.
- Prefer small vertical changes: one endpoint, worker behavior, queue contract, or frontend behavior per PR.

## Pull Request Checklist

- [ ] Typecheck, lint, and format pass.
- [ ] Unit and integration tests pass.
- [ ] Terraform is formatted and validated when infrastructure changes.
- [ ] Documentation is updated for behavior or architecture changes.
- [ ] No private identifiers or secrets are included.

## Security

Found a security issue? Do not open a public issue. Follow the instructions in [SECURITY.md](SECURITY.md).
