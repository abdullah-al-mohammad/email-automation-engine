# API Spec

The API uses NestJS and TypeScript.

## Principles

- All input DTOs use Zod schemas and inferred TypeScript types.
- Controllers use a shared Zod validation pipe.
- Environment variables are validated with Joi at boot.
- All endpoints are tenant-scoped.
- API response shapes are stable and documented.
- Workflow activation runs full validation before changing `isActive`.
- Active workflows are read-only for structural changes.
- Event ingestion accepts generic events.
- Authentication and authorization are required for tenant-scoped management APIs.

## NestJS Module Pattern

Use the same structure for every backend domain:

```text
modules/<domain>/
  application/
    dto/
    services/
  domain/
    aggregates/
    repositories/
  infrastructure/
    repositories/
  interface/
    http/
      controllers/
      guards/
      validators/
  constants/
```

Controllers stay thin. Business rules belong in application services and domain helpers. Persistence access goes through repository interfaces injected by tokens.

## Workflow Endpoints

```text
POST   /workflows
GET    /workflows
GET    /workflows/:workflowId
PATCH  /workflows/:workflowId
DELETE /workflows/:workflowId

PATCH  /workflows/:workflowId/activate
PATCH  /workflows/:workflowId/deactivate
```

## Trigger Endpoints

```text
POST   /workflows/:workflowId/triggers
PATCH  /workflows/:workflowId/triggers/:triggerId
DELETE /workflows/:workflowId/triggers/:triggerId
```

## Step Endpoints

```text
POST   /workflows/:workflowId/steps
GET    /workflows/:workflowId/steps/:stepId
PATCH  /workflows/:workflowId/steps/:stepId
PATCH  /workflows/:workflowId/steps/:stepId/reorder
DELETE /workflows/:workflowId/steps/:stepId
```

## Exit Condition Endpoints

```text
GET    /workflows/:workflowId/exit-conditions
PUT    /workflows/:workflowId/exit-conditions
```

## Email Template Endpoints

```text
POST   /tenants/:tenantId/email-templates
GET    /tenants/:tenantId/email-templates
GET    /tenants/:tenantId/email-templates/:id
PATCH  /tenants/:tenantId/email-templates/:id
DELETE /tenants/:tenantId/email-templates/:id
```

Requires `workflows.read` permission for read endpoints, `workflows.manage` for create/update/delete. Email templates are soft-deleted and tenant-scoped.

## Event Ingestion Endpoint

```text
POST /automation/events
```

Example request:

```json
{
  "tenantId": "tenant_123",
  "contactId": "contact_456",
  "event": "contact.subscribed",
  "metadata": {
    "source": "form",
    "formId": "form_1"
  },
  "occurredAt": "2026-01-01T00:00:00.000Z"
}
```

The API:

- Validate the event.
- Find matching active triggers.
- Enqueue a message to `automation-events`.
- Return an accepted response.

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

## Supported Trigger Events

Initial generic events:

- `contact.subscribed`
- `contact.unsubscribed`
- `tag.attached`
- `tag.detached`
- `email.sent`
- `email.delivered`
- `email.bounced`
- `email.complained`
- `email.opened`
- `email.link_clicked`
- `form.submitted`
- `custom.event`

## Supported Step Actions

Initial actions:

- `delay`
- `send_email`
- `attach_tag`
- `detach_tag`
- `unsubscribe_contact`
- `delete_contact`
- `conditional_split`
- `webhook`

## Activation Validation

Before activation:

- Workflow must have at least one trigger.
- Workflow must have at least one step.
- Trigger filters must be valid for their event.
- Delay steps must have amount and unit.
- Delay cannot be the final step.
- Email steps must have either a templateId or a subject/html pair.
- Email steps with a templateId validate the template exists and is not soft-deleted.
- Tag steps must have a tag reference.
- Webhook steps must have a valid non-private URL (SSRF protection: blocks localhost, private IP ranges, and malformed URLs).
- Conditional split steps must have valid true/false routing or conditions in the database.
- All referenced resources must belong to the same tenant.
