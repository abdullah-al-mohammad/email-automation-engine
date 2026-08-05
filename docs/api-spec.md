# API Spec

The API uses NestJS and TypeScript.

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
