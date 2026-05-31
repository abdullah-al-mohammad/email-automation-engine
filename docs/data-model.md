# Data Model

The data model uses product-neutral names that describe automation concepts.

## Naming Convention

Application code uses camelCase property names. Database tables and columns use snake_case.

Examples:

```text
Application property: tenantId
Database column:      tenant_id

Application property: contactWorkflowId
Database column:      contact_workflow_id

Application property: createdAt
Database column:      created_at
```

TypeORM handles this mapping through naming strategy and explicit column names where needed. Do not use snake_case property names in TypeScript code.

## Core Tables

### tenants

Owner namespace for workflows, contacts, tags, and templates.

Suggested fields:

- `id`
- `creatorId`
- `name`
- `createdAt`
- `updatedAt`

`creatorId` identifies the user who created the tenant. It is used for tenant ownership and access recovery, similar to a brand creator concept.

### users

Authenticated user account.

Suggested fields:

- `id`
- `email`
- `passwordHash`
- `status`
- `passwordUpdatedAt`
- `createdAt`
- `updatedAt`

### tenantMemberships

User membership in a tenant.

Suggested fields:

- `id`
- `tenantId`
- `userId`
- `roleId`
- `status`
- `createdAt`
- `updatedAt`

The tenant creator still has a normal membership row with the initial full-permission role.

### tenantInvitations

Pending invitation to join a tenant.

Suggested fields:

- `id`
- `tenantId`
- `senderId`
- `roleId`
- `email`
- `invitationToken`
- `message`
- `createdAt`
- `updatedAt`

### roles

Tenant-scoped role definition.

Suggested fields:

- `id`
- `tenantId`
- `name`
- `slug`
- `description`
- `createdAt`
- `updatedAt`

Role names and slugs are user-visible labels only. Authorization must use permissions, not fixed role names. Tenant setup should create a full-permission role for the tenant creator, but that role is still normal data backed by `rolePermissions`.

### rolePermissions

Permissions assigned to a role.

Suggested fields:

- `id`
- `roleId`
- `permission`
- `createdAt`
- `updatedAt`

### contacts

Subject that moves through workflows.

Suggested fields:

- `id`
- `tenantId`
- `email`
- `subscribed`
- `metadata`
- `createdAt`
- `updatedAt`
- `deletedAt`

### tags

Tenant-scoped label attachable to contacts.

Suggested fields:

- `id`
- `tenantId`
- `name`
- `createdAt`
- `updatedAt`

### contactTags

Many-to-many contact/tag relation.

Suggested fields:

- `contactId`
- `tagId`
- `createdAt`

### workflows

Automation definition.

Suggested fields:

- `id`
- `tenantId`
- `name`
- `description`
- `isActive`
- `status`
- `createdAt`
- `updatedAt`
- `activatedAt`

### workflowTriggers

Events that can start a workflow.

Suggested fields:

- `id`
- `tenantId`
- `workflowId`
- `event`
- `filters`
- `createdAt`
- `updatedAt`

### workflowSteps

Workflow action nodes.

Suggested fields:

- `id`
- `tenantId`
- `workflowId`
- `parentWorkflowStepId`
- `action`
- `config`
- `position`
- `trueStepId`
- `falseStepId`
- `createdAt`
- `updatedAt`

Action-specific configuration lives in `config` unless a field is needed for indexed queries.

### workflowStepConditions

Conditional split rules.

Suggested fields:

- `id`
- `tenantId`
- `workflowId`
- `workflowStepId`
- `type`
- `resource`
- `operator`
- `value`
- `logicalOperator`
- `createdAt`
- `updatedAt`

### workflowExitConditions

Workflow-level rules that stop a contact from continuing.

Suggested fields:

- `id`
- `tenantId`
- `workflowId`
- `type`
- `resource`
- `operator`
- `value`
- `createdAt`
- `updatedAt`

### contactWorkflows

One contact's run through one workflow.

Suggested fields:

- `id`
- `tenantId`
- `workflowId`
- `workflowTriggerId`
- `contactId`
- `status`
- `triggerEvent`
- `startedAt`
- `finishedAt`
- `createdAt`
- `updatedAt`

### contactWorkflowSteps

Execution record for one contact and one workflow step.

Suggested fields:

- `id`
- `tenantId`
- `contactWorkflowId`
- `workflowStepId`
- `status`
- `startedAt`
- `scheduledAt`
- `finishedAt`
- `error`
- `createdAt`
- `updatedAt`

### emailTemplates

Reusable email content used by workflow email steps.

Suggested fields:

- `id`
- `tenantId`
- `name`
- `subject`
- `html`
- `text`
- `createdAt`
- `updatedAt`
- `deletedAt`

### emailMessages

One workflow email send attempt and its tracking state.

Suggested fields:

- `id`
- `tenantId`
- `contactId`
- `contactWorkflowId`
- `contactWorkflowStepId`
- `workflowId`
- `workflowStepId`
- `templateId`
- `sesMessageId`
- `recipientEmailHash`
- `subject`
- `status`
- `sentAt`
- `deliveredAt`
- `bouncedAt`
- `complainedAt`
- `firstOpenedAt`
- `lastOpenedAt`
- `firstClickedAt`
- `lastClickedAt`
- `createdAt`
- `updatedAt`

Do not store recipient email in logs. If email address lookup is needed, use the contact record and tenant scoping.

### emailEvents

Append-only SES email activity used for tracking, reporting, triggers, and conditional split evaluation.

Suggested fields:

- `id`
- `tenantId`
- `emailMessageId`
- `contactId`
- `event`
- `url`
- `metadata`
- `occurredAt`
- `createdAt`

Initial events:

- `sent`
- `delivered`
- `bounced`
- `complained`
- `opened`
- `clicked`

Store the raw SES event payload in `metadata` only after removing or avoiding sensitive fields that should not be retained.

## Optional Tables

- `webhookDeliveries`
- `automationEvents`
- `contactFields`

## ORM Recommendation

Use PostgreSQL with TypeORM by default.

Reasons:

- It matches the NestJS Clean Architecture / DDD backend style.
- Entity classes can live near domain aggregates.
- Repository interfaces can be injected with TypeORM implementations.
- Migration generation and execution are well supported.
- PostgreSQL gives strong JSON, indexing, and transactional behavior for workflow data.

Rules:

- `synchronize` must be `false`.
- `migrationsRun` is explicit per environment, not hidden.
- Use TypeORM migrations for all schema changes.
- Use camelCase in TypeScript entities and DTOs.
- Use snake_case database table and column names.
- Keep TypeORM repository implementations behind domain repository interfaces.
- Use transactions for activation, step reorder, workflow start, and step finish operations.

## NestJS Module Placement

Entities and repository contracts live inside the owning domain module:

```text
apps/api/src/modules/workflow/
  domain/
    aggregates/workflow.aggregate.ts
    repositories/workflow.repository.ts
  infrastructure/
    repositories/typeorm-workflow.repository.ts
```

Database setup, migration data source, and TypeORM config live in:

```text
apps/api/src/infrastructure/database/
```
