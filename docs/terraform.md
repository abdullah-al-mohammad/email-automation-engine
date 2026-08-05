# Terraform Plan

Generic and reusable. No private state bucket names, account IDs, ARNs, domains, or fixed production assumptions.

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

- SQS queues and DLQs
- Lambda workers
- EventBridge schedule for delayed steps
- IAM roles with least-privilege policies
- S3 bucket / build artifact input for Lambda packages
- SES permissions for workflow email delivery

## Queue Standards

Every queue: DLQ, configurable retention, visibility timeout > Lambda timeout, long polling, project and environment prefixes.

**FIFO:**
- `workflow-emails.fifo`
- `conditional-split.fifo`
- `webhook-steps.fifo`

**Standard:**
- `automation-events`
- `waiting-contact-workflow-steps`
- `finished-contact-workflow-steps`
- `email-tracking-events`
- `webhook-deliveries`

## Lambda Standards

Every Lambda:
- `nodejs24.x` runtime (default)
- `arm64` (default)
- Configurable memory and timeout
- Environment variables from Terraform variables
- Least-privilege IAM
- Structured log retention

## Environment Variables

Generic examples: `NODE_ENV`, `APP_ENV`, `PROJECT_PREFIX`, `AWS_REGION`, `DATABASE_URL`, `REDIS_URL`, `REDIS_ENABLED`, `SES_FROM_EMAIL`, `SES_CONFIGURATION_SET`, plus `<QUEUE_NAME>_QUEUE_URL` for each queue.

## Backend State

Do not hardcode backend state in reusable modules. Provide an example only:

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

- Variables must have safe examples
- Secrets passed externally
- No committed `.tfvars` with real values
- Provide `terraform.example.tfvars`

## Database and Redis

Do not create PostgreSQL or Redis by default. Accept externally managed `DATABASE_URL` and `REDIS_URL`, pass them to API and worker environments, and support Lambda VPC settings via subnet/security group variables.
