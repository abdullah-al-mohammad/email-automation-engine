# Edge Cases

The implementation must be edge-case heavy because most automation bugs appear in uncommon timing, ordering, and retry conditions.

## Workflow Definition

- Activating workflow with no triggers.
- Activating workflow with no steps.
- Activating workflow with invalid trigger filters.
- Activating workflow with missing action config.
- Activating workflow with delay as final step.
- Activating workflow with conditional split missing true or false branch.
- Activating workflow with deleted referenced tag/template/resource.
- Editing structural fields while workflow is active.
- Deleting a step that has children.
- Deleting a branch step under conditional split.
- Reordering a step into its own descendant chain.
- Reordering across conditional split branches.
- Reordering first step.
- Reordering final step.
- Reordering while another update happens concurrently.

## Event Ingestion

- Event has no matching triggers.
- Event matches multiple triggers in one workflow.
- Event matches triggers across multiple workflows.
- Event is replayed by client.
- Event has malformed metadata.
- Event references missing contact.
- Event references contact from another tenant.
- Event arrives while workflow is being deactivated.
- Event arrives immediately after trigger update before cache invalidation completes.
- Redis cache is stale.
- Redis is unavailable.

## Auth and Permissions

- Unauthenticated request.
- Authenticated user without tenant membership.
- Tenant membership is inactive.
- User role does not include required permission.
- Role was deleted while membership still exists.
- Role has no permissions.
- Permission was removed while user has an active session.
- Last full-permission role is removed.
- Last member with role-management permission is downgraded.
- Tenant creator membership is removed or blocked.
- Non-creator user attempts to transfer tenant creator ownership.
- Tenant creator has a role with no permissions but still needs tenant access recovery.
- User tries to access another tenant's resource.
- User without workflow management permission attempts to mutate workflow.
- User attempts a setting without required permission.
- Tenant creator membership creation fails after tenant create.
- Invitation token is invalid.
- Invitation token is already accepted.
- Invitation role was deleted before acceptance.
- Invitation email does not match signed-in user.
- User rejects invitation.
- Sender no longer has permission to invite members.
- Password changed after token was issued.
- Blocked or inactive user attempts access.

## Workflow Start

- Duplicate queue message.
- Trigger exists but workflow is inactive by processing time.
- Workflow has no first step due to bad data.
- First step was deleted after event was queued.
- Contact was deleted after event was queued.
- Concurrent workers try to start same workflow path.
- Database transaction fails after partial writes.

## Step Execution

- Duplicate waiting-step message.
- Step already finished.
- Contact workflow already finished.
- Workflow deactivated before step execution.
- Contact deleted before step execution.
- Contact unsubscribed before email step.
- Missing tag for attach/detach step.
- Attach tag when tag is already attached.
- Detach tag when tag is not attached.
- Delete contact step replayed.
- Unsubscribe contact step replayed.
- Action config changed in draft but active workflow instance should use active definition.

## Email via AWS SES

- SES sender identity is not verified.
- SES rejects recipient.
- SES throttles send request.
- SES sandbox account cannot send to recipient.
- Missing from email.
- Missing subject.
- Missing HTML/text body.
- Contact has no email.
- Contact is unsubscribed before send.
- Email step replayed after successful send.
- SES send succeeds but follow-up status update fails.

## Email Tracking

- SES open event is duplicated.
- SES click event is duplicated.
- SES open or click event references an unknown message ID.
- SES event payload is missing expected engagement fields.
- SES webhook event is duplicated.
- SES webhook references an unknown message ID.
- SES webhook arrives before the local send status update finishes.
- Bounce or complaint arrives after a message was already marked delivered.
- Tracking logs must not include raw recipient email or sensitive SES payload data.

## Delay

- Delay amount is zero.
- Delay amount is negative.
- Delay unit is invalid.
- Scheduled time is in the past.
- Scheduler runs late.
- Scheduler sees same due step twice.
- Workflow deactivated during delay.
- Step deleted while delayed record exists.

## Conditional Split

- No conditions.
- Unsupported condition type.
- Referenced resource deleted.
- Contact has no required field.
- Multiple conditions with AND.
- Multiple conditions with OR.
- Condition value type mismatch.
- Campaign/email activity missing or expired.
- Conditional split result replayed.

## Webhook

- Invalid URL.
- Private network URL if SSRF protection is enabled.
- Timeout.
- 4xx response.
- 5xx response.
- DNS failure.
- Payload too large.
- Header config includes unsafe headers.
- Delivery queued but external call fails.
- Duplicate delivery message.

## Queue and Worker

- Malformed JSON body.
- Unsupported message version.
- Missing required message fields.
- Batch contains mixed valid and invalid records.
- Partial batch failure response includes only failed message IDs.
- Worker timeout after some records complete.
- DLQ redrive replays old message version.
- FIFO dedupe key collision.
- Visibility timeout too short.

## Data and Tenant Safety

- Tenant ID missing.
- Resource belongs to another tenant.
- Contact belongs to another tenant.
- Workflow belongs to another tenant.
- Step belongs to another workflow.
- Trigger belongs to another workflow.
- Exit condition belongs to another workflow.
- Soft-deleted resource is referenced.

## Open-Source Safety

- Example config accidentally contains private names.
- Terraform example contains real backend.
- Logs include contact email or webhook payload.
- Test fixtures include private data.
- Docs mention private product names or domains.
