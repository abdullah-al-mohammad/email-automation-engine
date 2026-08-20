# Contributing

Thanks for helping out. Keep changes small, clear, and easy to review.

## Start here

1. Find a `good first issue`, or open an issue first if the change is new.
2. Fork the repo and create a branch.
3. Make one focused change.
4. Add or update tests.
5. Run the checks below, then open a pull request.

## Setup

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm test
pnpm test:integration
pnpm typecheck
pnpm lint
pnpm format:check
```

To fix lint and formatting issues:

```bash
pnpm lint:fix
```

## Style

- Use TypeScript strict mode.
- Keep controllers thin and logic testable.
- Prefer small vertical changes.
- Keep names generic and product-neutral.
- Do not include secrets, private domains, account IDs, ARNs, or customer data.

## Pull request

- Explain what changed and why.
- Make sure checks pass.
- Update docs if behavior changed.

## Security

Do not open a public issue for security problems. Follow [SECURITY.md](SECURITY.md).
