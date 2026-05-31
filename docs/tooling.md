# Tooling

## Recommendation

Use:

- Node.js as the production runtime.
- pnpm as the package manager.
- Turborepo for monorepo task orchestration.

## Runtime

Use Node.js 24 for API and worker runtime.

Reasons:

- AWS Lambda provides managed Node.js runtimes.
- Managed Lambda runtimes receive AWS runtime maintenance and security updates.
- NestJS, TypeORM, AWS SDK, and common testing tools have the most predictable support on Node.js.
- It avoids custom runtime/container complexity for Lambda workers.

Target runtime:

- API runtime: Node.js 24.
- Lambda worker runtime: `nodejs24.x`.
- Do not automatically move to a newer Node.js major version without an explicit project decision.

## Package Manager

Use pnpm.

Reasons:

- Fast installs.
- Reliable workspace support.
- Efficient disk usage.
- Widely used in TypeScript monorepos.
- Less runtime risk than choosing a newer JavaScript runtime as the production execution environment.

`packages/shared` is private and internal. It is used only to share contracts, schemas, and constants inside the monorepo and is not planned for npm publishing.

## Monorepo Orchestration

Use Turborepo.

Reasons:

- Simple task graph for `build`, `test`, `lint`, and `typecheck`.
- Good caching behavior.
- Works well with pnpm workspaces.
- Does not force framework-specific structure.

## Turborepo Usage Boundaries

Use Turborepo only for task orchestration and caching.

Turborepo should not own architecture, dependency boundaries, deployment logic, or package publishing decisions. Each app and package must still have clear scripts that can run directly through pnpm.

Required scripts per app/package where applicable:

- `build`
- `test`
- `test:integration`
- `lint`
- `format:check`
- `typecheck`

The root `turbo.json` should only compose these scripts. If Turborepo causes friction, contributors should still be able to run the underlying `pnpm --filter <name> <script>` command directly.

Recommended root tasks:

```text
pnpm build
pnpm test
pnpm lint
pnpm typecheck
pnpm format:check
```

This gives the monorepo caching benefits without making the project dependent on Turborepo-specific magic.
