# Worker Flow

Workers should be TypeScript modules deployable as AWS Lambda handlers and testable as plain functions.

## Queues

Core queues:

- `automation-events`
- `waiting-contact-workflow-steps`
- `finished-contact-workflow-steps`

Specialized queues:

- `workflow-emails.fifo`
- `email-tracking-events`
- `conditional-split.fifo`
- `webhook-steps.fifo`
- `webhook-deliveries`

Every queue should have:

- Dead-letter queue.
- Message retention configured.
- Visibility timeout longer than worker timeout.
- Partial failure handling.

## start-workflows

Triggered by `automation-events`.

Responsibilities:

- Parse event messages.
- Deduplicate by `contactId`, event, and trigger IDs.
- Load active matching workflows and first steps.
- Create `contactWorkflows` records in app code.
- Enqueue first-step messages to `waiting-contact-workflow-steps`.

## start-workflow-steps

Triggered by `waiting-contact-workflow-steps`.

Responsibilities:

- Deduplicate by contact, workflow, and workflow step.
- Mark contact workflow as in progress.
- Create or find an unfinished `contactWorkflowSteps` record in app code.
- Load contact and step details.
- Execute simple actions.
- Route specialized actions to dedicated queues.
- Send completion messages to `finished-contact-workflow-steps`.

Action behavior:

- `delay`: calculate `scheduledAt`; finish immediately only when due.
- `send_email`: enqueue to `workflow-emails.fifo`.
- `attach_tag`: create contact/tag relation, then finish.
- `detach_tag`: remove contact/tag relation, then finish.
- `unsubscribe_contact`: mark contact unsubscribed, then finish.
- `delete_contact`: soft-delete contact, then finish.
- `conditional_split`: enqueue to `conditional-split.fifo`.
- `webhook`: enqueue to `webhook-steps.fifo`.

## finish-workflow-steps

Triggered by `finished-contact-workflow-steps`.

Responsibilities:

- Mark step as finished.
- Determine next step.
- For conditional split, choose true or false branch.
- Check workflow exit conditions.
- Finish contact workflow when no next step remains.
- Enqueue next step when it exists.

## watch-workflow-steps

Triggered by scheduler.

Responsibilities:

- Find due delayed workflow steps.
- If parent workflow is inactive, finish the contact workflow.
- If parent workflow is active, enqueue step back to `waiting-contact-workflow-steps`.

## conditional-split

Triggered by `conditional-split.fifo`.

Responsibilities:

- Load step conditions.
- Evaluate conditions against contact, tags, fields, and email activity.
- Send finish messages with `conditionalSplitResult`.

## send-workflow-email

Triggered by `workflow-emails.fifo`.

Responsibilities:

- Load contact, workflow step, and email template.
- Skip sending when the contact is unsubscribed or deleted.
- Create or reuse an `emailMessages` record for idempotent replay.
- Send email through AWS SES with the configured SES configuration set.
- Store the SES message ID and sent status.
- Record an `email.sent` event.
- Send completion messages to `finished-contact-workflow-steps` after the send state is recorded.

## process-email-tracking-event

Triggered by `email-tracking-events` when SES event handling is deferred from the SES webhook.

Responsibilities:

- Deduplicate repeated SES tracking events.
- Store append-only `emailEvents` records.
- Update aggregate timestamp fields on `emailMessages`.
- Emit generic automation events for `email.opened`, `email.link_clicked`, `email.delivered`, `email.bounced`, and `email.complained` when workflows can be triggered by those events.

## webhook-step

Triggered by `webhook-steps.fifo`.

Responsibilities:

- Build webhook delivery payload.
- Enqueue delivery message.
- Finish workflow step after delivery is queued.

## call-webhook

Triggered by `webhook-deliveries`.

Responsibilities:

- POST payload to external URL.
- Use timeout.
- Return partial failures for retry.
- Never log sensitive payload fields.

## Worker Rules

- Workers must be idempotent.
- Queue message contracts must be versioned.
- SQS handlers return partial batch failures.
- Use structured logs.
- Do not log contact email or personal data.
- Use transactions for state changes that must be atomic.
- Do not implement manual retry loops when queue retry/DLQ behavior is enough.
- Every worker must have tests for success, idempotent replay, malformed message handling, and partial failures.

## Strict Behavior Tests

Worker tests must prove:

- Duplicate automation event messages do not create duplicate active runs.
- Replayed waiting-step messages do not duplicate step records.
- Completed steps are not executed twice.
- Delayed steps are scheduled and resumed correctly.
- Inactive workflows stop delayed continuation.
- Conditional split result routes to the expected branch.
- Webhook workflow progression is decoupled from external delivery success.
- Email send replay does not send duplicate workflow emails.
- Repeated SES open events do not corrupt first-open timestamps.
- SES click events are stored without app-owned click redirect logic.
