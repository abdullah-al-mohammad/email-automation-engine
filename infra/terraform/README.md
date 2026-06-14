# Email Automation Engine - Terraform

This directory contains the Infrastructure-as-Code (IaC) layer for deploying the Email Automation Engine worker architecture to AWS.

## Architecture

We use an AWS-first serverless architecture:

- **AWS SQS**: Highly reliable queues and Dead Letter Queues (DLQs) for event ingestion, workflow execution, and webhooks.
- **AWS Lambda**: Serverless compute for the Node.js worker handlers.
- **AWS EventBridge**: Scheduling layer to trigger delayed step evaluation.

_Note: PostgreSQL and Redis are intentionally left out of this Terraform configuration. We expect you to bring your own managed database (e.g., RDS, Aurora, Supabase) and pass the connection string via `DATABASE_URL`._

## Directory Structure

- `modules/sqs-queue`: Reusable module for provisioning queues with DLQs and Long Polling.
- `modules/lambda-worker`: Reusable module for provisioning Lambda functions with IAM roles and SQS triggers.
- `modules/eventbridge-schedule`: Reusable module for provisioning EventBridge cron schedules.
- `environments/example`: A fully wired example environment combining all modules.

## How to Deploy

1. Navigate to the `environments/example` directory:

   ```bash
   cd environments/example
   ```

2. Copy the example variables file:

   ```bash
   cp terraform.example.tfvars terraform.tfvars
   ```

3. Fill in your real values in `terraform.tfvars`:
   - `database_url`: Your PostgreSQL connection string.
   - `redis_url`: Your Redis connection string.
   - `ses_from_email`: A verified email address or domain in AWS SES.

4. Initialize and apply:
   ```bash
   terraform init
   terraform apply
   ```

## State Management

By default, the example uses local state. For production deployments, uncomment the `backend "s3"` block in `providers.tf` and provide your state bucket details.
