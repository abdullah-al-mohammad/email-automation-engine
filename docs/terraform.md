# Terraform Plan

Terraform should be generic and reusable. It must not include private state bucket names, account IDs, ARNs, domains, or fixed production assumptions.

## Layout

```text
infra/
  terraform/
    modules/
      lambda-worker/
      sqs-queue/
      eventbridge-schedule/
    environments/
      example/
```

## Resources

Initial AWS resources:

- SQS queues and DLQs.
- Lambda workers.
- EventBridge schedule for delayed steps.
- IAM roles and least-privilege policies.
- S3 bucket or build artifact input for Lambda packages.
- AWS SES permissions for workflow email delivery.

## Queue Standards

Every queue:

- Has a DLQ.
- Uses configurable retention.
- Has visibility timeout greater than Lambda timeout.
- Has long polling enabled.
- Uses project and environment prefixes.

FIFO queues:

- `workflow-emails.fifo`
- `conditional-split.fifo`
- `webhook-steps.fifo`

Standard queues:

- `automation-events`
- `waiting-contact-workflow-steps`
- `finished-contact-workflow-steps`
- `email-tracking-events`
- `webhook-deliveries`

## Lambda Standards

Every Lambda:

- Uses `nodejs24.x` runtime by default.
- Uses `arm64` by default.
- Uses configurable memory and timeout.
- Gets environment variables from Terraform variables.
- Uses least-privilege IAM.
- Has structured log retention configuration.

## Environment Variables

Generic examples:

- `NODE_ENV`
- `APP_ENV`
- `PROJECT_PREFIX`
- `AWS_REGION`
- `DATABASE_URL`
- `REDIS_URL`
- `REDIS_ENABLED`
- `SES_FROM_EMAIL`
- `SES_CONFIGURATION_SET`
- `AUTOMATION_EVENTS_QUEUE_URL`
- `WAITING_STEPS_QUEUE_URL`
- `FINISHED_STEPS_QUEUE_URL`
- `WORKFLOW_EMAILS_QUEUE_URL`
- `EMAIL_TRACKING_EVENTS_QUEUE_URL`
- `CONDITIONAL_SPLIT_QUEUE_URL`
- `WEBHOOK_STEPS_QUEUE_URL`
- `WEBHOOK_DELIVERIES_QUEUE_URL`

## Backend State

Do not hardcode backend state in reusable modules.

Provide an example only:

```hcl
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "email-automation-engine/example.tfstate"
    region = "us-east-1"
  }
}
```

## Open-Source Requirements

- Variables must have safe examples.
- Secrets must be passed externally.
- Do not commit `.tfvars` with real values.
- Provide `terraform.example.tfvars`.

## Database and Redis

Terraform should follow this AWS-first infrastructure pattern:

- Do not create PostgreSQL or Redis resources by default.
- Accept externally managed `DATABASE_URL` and `REDIS_URL` values.
- Pass those values to API and worker runtime environments.
- Configure Lambda VPC settings when needed through provided subnet and security group variables.

This keeps infrastructure focused on the automation runtime while allowing users to bring their own managed PostgreSQL and Redis.
