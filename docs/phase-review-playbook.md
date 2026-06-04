# Phase Review Playbook

This playbook is for reviewing a completed implementation phase before it is committed or merged. It is written for a coding agent or reviewer who only has access to this repository and the phase notes.

Use it after each phase implementation. Update the placeholders near the top, run the command checklist, then use the review prompt to inspect the changed files.

## Review Inputs

Update these values before each review:

```bash
REPO_DIR="/absolute/path/to/email-automation-engine"
BASE_REF="HEAD"
PHASE_NAME="Phase 1"
PHASE_DOCS="docs/project-status.md docs/roadmap.md docs/architecture.md docs/testing.md"
EXPECTED_SCOPE="Short description of what this phase was supposed to deliver."
```

Use `BASE_REF="origin/main"` when reviewing all local work since the main branch. Use `BASE_REF="HEAD"` when reviewing only uncommitted changes after the last commit.

If the implementation was guided by private reference repositories or private notes, do not copy their names, paths, domains, secrets, or company-specific wording into this repository or into the review output. Compare behavior and engineering patterns only.

## Command Checklist

Run these commands from the repository root.

```bash
cd "$REPO_DIR"
pwd
git status --short
git diff --name-status "$BASE_REF"
git diff --stat "$BASE_REF"
git diff --check "$BASE_REF"
```

List all changed files, including untracked files:

```bash
git diff --name-only "$BASE_REF"
git ls-files --others --exclude-standard
```

Read the phase and architecture context:

```bash
sed -n '1,240p' docs/project-status.md
sed -n '1,260p' docs/roadmap.md
sed -n '1,260p' docs/architecture.md
sed -n '1,260p' docs/engineering-rules.md
sed -n '1,260p' docs/testing.md
```

Run a public-safety scan. Before running it, replace the placeholder terms with any private project names, private domains, private company names, personal paths, internal service names, or private Git hosts that must never appear in the public repository.

```bash
PRIVATE_TERMS_REGEX='(REPLACE_WITH_PRIVATE_TERMS|internal-domain\.example|private-company-name|/local/private/path|private-git-host[:/][^[:space:]]+)'
rg -n --hidden -S "$PRIVATE_TERMS_REGEX" README.md CONTRIBUTING.md docs apps packages infra .github package.json pnpm-workspace.yaml turbo.json tsconfig*.json
```

Run the full project gates:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

If a command fails because dependencies are missing, install dependencies and rerun the failed command:

```bash
pnpm install --frozen-lockfile
```

If the phase includes database migrations, inspect migration ordering and table/column naming:

```bash
ls -1 apps/api/src/infrastructure/database/migrations
rg -n "createTable|addColumn|foreignKeys|references|snake_case|camelCase" apps/api/src/infrastructure/database apps/api/src/modules
```

If the phase includes queue, cache, worker, or async processing, inspect both API and worker paths:

```bash
rg -n "QUEUE_TYPE|CACHE_TYPE|REDIS_URL|SQS|queue|cache|worker|handler" apps/api apps/worker packages/shared docs
```

If the phase includes frontend work, inspect routes, API calls, state handling, and browser-visible text:

```bash
rg -n "Route|createBrowserRouter|useQuery|useMutation|fetch|axios|form|editor|tenant|permission|role" apps/web packages/shared docs
```

If the phase includes Terraform or AWS integration, inspect variables, outputs, examples, and secret handling:

```bash
rg -n "aws_|ses|sqs|lambda|iam|secret|password|token|access_key|variable|output" infra docs README.md
```

## Review Prompt

Give this prompt to the reviewing agent after running the command checklist. Include the command output and the changed file list.

```text
You are reviewing a completed implementation phase in an open-source TypeScript monorepo.

Repository:
- Backend: NestJS in apps/api
- Frontend: React in apps/web
- Worker: TypeScript in apps/worker
- Shared contracts: packages/shared
- Infrastructure: infra/terraform
- Runtime: Node.js 24
- Package manager: pnpm
- Build orchestration: Turborepo
- Database: PostgreSQL with TypeORM
- App code uses camelCase. Database tables and columns use snake_case.
- Public repository: no private company names, private repo names, private domains, personal paths, secrets, tokens, or internal-only wording may appear in committed files.

Phase:
- Name: <PHASE_NAME>
- Expected scope: <EXPECTED_SCOPE>
- Phase docs to check: <PHASE_DOCS>
- Base ref used for diff: <BASE_REF>

Review only the files changed in this phase, but check related files when needed to understand behavior. Do not suggest broad rewrites unless they are required to fix a real bug, security issue, broken contract, or maintainability problem introduced by this phase.

Review priorities, in order:
1. Blocking correctness issues:
   - Runtime errors
   - Broken dependency injection
   - Broken imports or exports
   - Broken app startup
   - Broken queue/cache/worker behavior
   - Broken database migrations
   - Broken shared contracts between API, worker, and web
2. Data and multi-tenant safety:
   - Tenant scoping is enforced in services, repositories, queries, guards, and handlers
   - A tenant cannot read, update, delete, enqueue, or process another tenant's data
   - Tenant creator or owner behavior is explicit where relevant
   - No hardcoded roles are introduced when modular permissions are expected
3. Open-source safety:
   - No private names, domains, repository paths, personal filesystem paths, secrets, tokens, or company-specific wording
   - Docs sound human and product-focused, not AI-generated
   - No references to private source projects
4. Architecture fit:
   - NestJS modules follow the existing layout
   - Domain, application, infrastructure, and interface code stay in the correct boundaries
   - Shared package contains contracts and schemas only, not app-specific logic
   - Worker logic is not hidden only inside the API when worker behavior is required
   - Frontend code does not duplicate backend domain rules unnecessarily
5. TypeScript and contracts:
   - DTOs, schemas, and shared message contracts agree across apps
   - Zod schemas are used where the project expects runtime validation
   - No `any` or type assertions hide contract mismatches unless justified
   - Public APIs return stable, typed shapes
6. Config and environment behavior:
   - New environment variables are validated
   - Defaults are intentional and documented
   - Selecting an external service without required config fails clearly
   - Missing optional services degrade only when the docs say they should
7. Database and migrations:
   - Migrations are deterministic and ordered
   - Table and column names are snake_case
   - App entities and aggregates expose camelCase
   - Foreign keys, indexes, unique constraints, nullable fields, and cascade behavior are intentional
   - Migrations do not rely on local state
8. Queue, cache, and worker behavior:
   - Queue message versions are explicit
   - Queue adapters are tested for success, partial failure, and invalid payloads
   - Worker handlers can resume safely after failure
   - Cache failures do not corrupt source-of-truth data
   - Retry and idempotency behavior is clear
9. Email and AWS behavior:
   - SES-only assumptions are respected
   - No application-owned tracking pixel or click redirect is added when SES/AWS handles tracking
   - AWS SDK usage does not hardcode credentials
   - AWS region and endpoints are configurable where needed
10. Frontend behavior, if changed:
   - UI matches the app style and is not a marketing page unless the phase requires one
   - Forms validate client-side and still rely on backend validation
   - Loading, empty, error, and permission states are handled
   - Text is clear, human, and public-safe
11. Tests:
   - New behavior has focused unit tests
   - Cross-app contracts have shared package tests when appropriate
   - Integration tests cover database or API behavior when unit tests are not enough
   - Tests include edge cases, failure paths, and tenant boundaries
12. Tooling and CI:
   - Node.js 24 remains explicit
   - pnpm versions and lockfile changes are consistent
   - CI commands match local commands
   - No generated noise or unrelated formatting churn is included

Output format:
- Start with findings only.
- Sort findings by severity: Critical, High, Medium, Low.
- For each finding include:
  - Severity
  - File and line number
  - What is wrong
  - Why it matters
  - Suggested fix
- If there are no findings, say: "No blocking issues found."
- Then list "Verification" with pass/fail status for each command that was run.
- Then list "Residual Risk" with any important behavior not covered by tests.
- Keep the review specific. Do not include generic advice.
```

## Manual Inspection Checklist

Use this checklist after the automated gates pass.

- The phase delivered exactly what the phase notes promised.
- No unrelated files changed.
- Untracked files are intentional.
- New modules are exported where other apps need them.
- Public docs remain clean, readable, and free of implementation gossip.
- New config values appear in validation, configuration loading, docs, and tests.
- Every external dependency has a clear reason.
- Every new AWS integration has configurable region and no hardcoded credentials.
- Every queue message has a typed schema and a version.
- Every worker handler handles invalid input and repeat delivery.
- Every database query that touches tenant data is tenant-scoped.
- Every migration can run on a clean database.
- Tests cover the failure path, not only the happy path.

## Suggested Phase-Specific Focus

Use these extra checks depending on the phase.

### Foundation and Tooling

- Confirm `package.json`, `pnpm-workspace.yaml`, `turbo.json`, and CI agree on commands.
- Confirm Node.js 24 is explicit in docs and CI.
- Confirm all workspaces participate in build, lint, typecheck, and test.

### Auth and Permissions

- Confirm permissions are modular and not hardcoded as a fixed role list.
- Confirm tenant creator behavior is represented through tenant ownership or membership fields.
- Confirm guards fail closed when user, tenant, membership, or permission data is missing.
- Confirm database records use snake_case and application code uses camelCase.

### Workflow and Automation

- Confirm workflow steps have clear ordering and transition rules.
- Confirm invalid workflow shapes are rejected before execution.
- Confirm automation events are idempotent or safely repeatable.
- Confirm worker handlers can continue from the last durable state after failure.

### Contacts and Segmentation

- Confirm contact ownership is tenant-scoped everywhere.
- Confirm imports, tags, and workflow enrollment cannot cross tenants.
- Confirm duplicate contacts and conflicting tags are handled intentionally.

### Queue and Cache

- Confirm API and worker both support the same message contracts.
- Confirm queue adapters handle batch limits and partial failures.
- Confirm cache adapters fail clearly when selected without required configuration.
- Confirm cache misses fall back to the database where required.

### Email and SES

- Confirm SES is the only provider assumed.
- Confirm no custom tracking pixel or click redirect is added when SES handles events.
- Confirm bounce, complaint, delivery, open, and click event paths are typed and tested when introduced.

### Terraform

- Confirm Terraform does not manage services that the project intentionally keeps external.
- Confirm secrets are variables or environment-driven, not committed values.
- Confirm outputs do not expose sensitive values.
- Confirm README examples are usable without private account details.

### Frontend

- Confirm raw HTML or WYSIWYG email editing matches the current phase decision.
- Confirm no visual workflow builder is introduced unless the phase requires it.
- Confirm API contracts come from shared schemas or typed client boundaries.
- Confirm tenant and permission state is reflected in routes and actions.

## Reviewer Notes Template

Use this structure for the final review result:

```text
Findings

Critical
- None

High
- None

Medium
- <file:line> <issue>. <why it matters>. Suggested fix: <fix>.

Low
- <file:line> <issue>. <why it matters>. Suggested fix: <fix>.

Verification
- git diff --check: pass/fail
- pnpm format:check: pass/fail
- pnpm lint: pass/fail
- pnpm typecheck: pass/fail
- pnpm test: pass/fail
- pnpm test:integration: pass/fail
- pnpm build: pass/fail

Residual Risk
- <Anything important not covered by tests, or "None noticed.">

Summary
- <One or two sentences only.>
```
