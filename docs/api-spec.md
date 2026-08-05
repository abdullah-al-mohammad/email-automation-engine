# API Spec

The API is a NestJS application with TypeScript. All management endpoints are tenant-scoped and protected by an auth token plus tenant membership and permission checks. Route parameters use `:tenantId` for the tenant and `:id`/`:workflowId` etc. for resource ids.

## Auth

```text
POST   /auth/signup
POST   /auth/signin
GET    /auth/me
```

## Tenants

```text
POST   /tenants
GET    /tenants
GET    /tenants/:id
PATCH  /tenants/:id
DELETE /tenants/:id
```

## Roles

Requires `settings.manage`.

```text
GET    /tenants/:tenantId/roles
POST   /tenants/:tenantId/roles
PATCH  /tenants/:tenantId/roles/:id
DELETE /tenants/:tenantId/roles/:id
```

## Members

`members.read` for reads, `members.manage` for changes.

```text
GET    /tenants/:tenantId/members
DELETE /tenants/:tenantId/members/:userId
```

## Invitations

`members.read` for reads, `members.manage` for changes.

```text
GET    /tenants/:tenantId/invitations
POST   /tenants/:tenantId/invitations
DELETE /tenants/:tenantId/invitations/:id
```

## Contacts

`contacts.read` for reads, `contacts.manage` for changes.

```text
GET    /tenants/:tenantId/contacts
GET    /tenants/:tenantId/contacts/:contactId
POST   /tenants/:tenantId/contacts
PATCH  /tenants/:tenantId/contacts/:contactId
DELETE /tenants/:tenantId/contacts/:contactId

POST   /tenants/:tenantId/contacts/import/preview
POST   /tenants/:tenantId/contacts/import

POST   /tenants/:tenantId/contacts/:contactId/tags/:tagId
DELETE /tenants/:tenantId/contacts/:contactId/tags/:tagId
```

## Tags

`contacts.read` for reads, `tags.manage` for changes.

```text
GET    /tenants/:tenantId/tags
POST   /tenants/:tenantId/tags
DELETE /tenants/:tenantId/tags/:tagId
```

## Workflows

`workflows.read` for reads, `workflows.manage` for create/update/delete, `workflows.activate` for activate/deactivate.

```text
POST   /tenants/:tenantId/workflows
GET    /tenants/:tenantId/workflows
GET    /tenants/:tenantId/workflows/:id
PATCH  /tenants/:tenantId/workflows/:id
DELETE /tenants/:tenantId/workflows/:id

PATCH  /tenants/:tenantId/workflows/:id/activate
PATCH  /tenants/:tenantId/workflows/:id/deactivate
```

## Triggers

```text
GET    /tenants/:tenantId/workflows/:id/triggers
POST   /tenants/:tenantId/workflows/:id/triggers
PATCH  /tenants/:tenantId/workflows/:id/triggers/:triggerId
DELETE /tenants/:tenantId/workflows/:id/triggers/:triggerId
```

## Steps

```text
GET    /tenants/:tenantId/workflows/:id/steps
POST   /tenants/:tenantId/workflows/:id/steps
GET    /tenants/:tenantId/workflows/:id/steps/:stepId
PATCH  /tenants/:tenantId/workflows/:id/steps/:stepId
POST   /tenants/:tenantId/workflows/:id/steps/:stepId/reorder
DELETE /tenants/:tenantId/workflows/:id/steps/:stepId
```

## Step Conditions

```text
GET /tenants/:tenantId/workflows/:workflowId/steps/:stepId/conditions
PUT /tenants/:tenantId/workflows/:workflowId/steps/:stepId/conditions
```

## Exit Conditions

```text
GET    /tenants/:tenantId/workflows/:id/exit-conditions
PUT    /tenants/:tenantId/workflows/:id/exit-conditions
POST   /tenants/:tenantId/workflows/:id/exit-conditions
PATCH  /tenants/:tenantId/workflows/:id/exit-conditions/:conditionId
DELETE /tenants/:tenantId/workflows/:id/exit-conditions/:conditionId
```

## Execution Summary

`workflows.read`.

```text
GET /tenants/:tenantId/workflows/:workflowId/execution
GET /tenants/:tenantId/workflows/:workflowId/execution/:contactWorkflowId
```

## Email Templates

`workflows.read` for reads, `workflows.manage` for create/update/delete. Templates are soft-deleted and tenant-scoped.

```text
POST   /tenants/:tenantId/email-templates
GET    /tenants/:tenantId/email-templates
GET    /tenants/:tenantId/email-templates/:id
PATCH  /tenants/:tenantId/email-templates/:id
DELETE /tenants/:tenantId/email-templates/:id
```

## Event Ingestion

Accepts a generic event, finds matching active triggers, and enqueues it to the automation queue. Returns `202 Accepted`.

```text
POST /automation/events
```

## SES Tracking Webhook

Email tracking uses AWS SES configuration sets and SES event notifications. The application does not add its own tracking pixel, rewrite email links, or expose app-owned click redirect endpoints for tracking.

```text
POST /webhooks/ses
```

SES webhook behavior:

- Accept SES delivery, bounce, complaint, open, and click events.
- Resolve the SES message ID to an email message.
- Record the matching email event.
- Update message status and first/last activity timestamps.
- Emit generic automation events such as `email.opened` and `email.link_clicked` when workflows can be triggered by those events.
- Keep webhook processing idempotent because SES notifications can be retried.
- Map SES PascalCase event types (`Delivery`, `Bounce`, `Open`) to lowercase schema values (`delivered`, `bounced`, `opened`).

## Health

```text
GET /health
```
