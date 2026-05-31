# Open Source Scope

## Goal

Build an email automation engine that can create, manage, activate, and execute event-driven workflows for contacts or other user-defined subjects.

The project is TypeScript-first and independent from any private product, infrastructure, URLs, secrets, customer data, or business-specific assumptions.

## Product Boundary

The engine includes:

- Workflow creation and management.
- Tenant creation and management.
- User authentication and modular tenant permissions.
- Visual workflow builder.
- Trigger management.
- Step/action management.
- Activation validation.
- Workflow execution workers.
- Delays and scheduled step continuation.
- Conditional split evaluation.
- Webhook delivery.
- AWS SES workflow email delivery.
- SES delivery/bounce/complaint tracking.
- SES open and click tracking.
- Terraform for deployable AWS infrastructure.
- Test coverage for workflow behavior, queue contracts, frontend builder behavior, and Terraform validation.

The engine does not assume:

- A specific SaaS product.
- A specific tenant name such as brand/account/customer.
- A specific billing system.
- A specific CRM, campaign, or analytics product.
- A specific production domain or cloud account.

The first public version is AWS SES-only for email delivery and tracking. Multi-provider email support is intentionally deferred.

## Domain Language

Use these terms consistently:

- `tenant`: owner namespace for workflows and contacts.
- `contact`: subject moving through a workflow.
- `workflow`: automation definition.
- `trigger`: event matcher that starts a workflow.
- `step`: action executed for a contact.
- `event`: input that may start a workflow.
- `contactWorkflow`: one contact's workflow run.
- `contactWorkflowStep`: one contact's execution record for one step.

Avoid company-specific or product-specific terms in public code, docs, and examples.

## Public Repository Rules

- Do not copy private source files.
- Do not copy private docs verbatim.
- Do not include company names, private service names, URLs, domains, Git remote names, account IDs, ARNs, S3 buckets, database names, or secret names.
- Use neutral examples such as `example.com`, `tenant_123`, and `us-east-1`.
- Include example Terraform only; users must provide their own backend, cloud account, and variables.
- Convert required behavior into generic tests and acceptance criteria instead of copying private implementation details.

## Strict Behavior

The automation engine spans API behavior, frontend builder behavior, and asynchronous worker behavior. These behaviors need to stay consistent across the codebase.

Strictly preserve:

- Workflow activation validation.
- Active workflow read-only behavior.
- Trigger matching semantics.
- Step action semantics.
- Delay scheduling and watcher behavior.
- Conditional split routing.
- Webhook queueing and delivery separation.
- Queue-driven worker handoff.
- Idempotent worker execution.
- Partial failure handling for queue batches.

Do not preserve private naming, private infrastructure identifiers, private product assumptions, or copied source code.

## First Public Version

The first public version focuses on the automation engine before broader product features.

Include:

- User sign up/sign in.
- Workflow CRUD.
- Tenant CRUD.
- Tenant membership, custom roles, and modular permissions.
- Trigger CRUD.
- Step CRUD.
- Activation/deactivation.
- Generic event ingestion.
- Delay step.
- Tag attach/detach step.
- Unsubscribe/delete contact step.
- Conditional split step.
- Webhook step.
- AWS SES email step.
- SES delivery, bounce, complaint, open, and click tracking.
- Worker execution flow.
- Terraform for queues, workers, scheduler, and basic database connectivity.

Defer:

- Billing and quota systems.
- Advanced reporting.
- Multi-provider email sending and tracking.
- Import/export flows.
