# Demo Deployment Guide

This guide outlines how to deploy a demo instance of the Email Automation Engine using AWS and Terraform.

## Prerequisites

1. AWS Account with Administrator access.
2. Terraform CLI installed (v1.5+).
3. Node.js 24 and pnpm installed.
4. Docker (optional, for local PostgreSQL/Redis testing).

## Infrastructure Provisioning

1. Navigate to the Terraform example environment:
   ```bash
   cd infra/terraform/environments/example
   ```
2. Initialize Terraform:
   ```bash
   terraform init
   ```
3. Plan and apply the infrastructure. Provide an AWS Region and resource prefix (e.g., `eae-demo`):
   ```bash
   terraform plan -var="aws_region=us-east-1" -var="environment=demo" -var="project_prefix=eae"
   terraform apply
   ```

This will provision the necessary SQS queues for the engine.

## Database Setup

For a demo, you can spin up PostgreSQL using Docker locally:

```bash
docker run --name eae-postgres -e POSTGRES_USER=engine_user -e POSTGRES_PASSWORD=engine_password -e POSTGRES_DB=engine_db -p 5432:5432 -d postgres:15-alpine
```

## Running the API

1. Start from the root directory. Install dependencies and build all packages:
   ```bash
   pnpm install
   pnpm build
   ```
2. Navigate to the `apps/api` directory:
   ```bash
   cd apps/api
   ```
3. Copy `.env.example` to `.env` and adjust the variables, including your AWS credentials (or ensure you have an active AWS SSO session) and the SQS Queue URLs outputted by Terraform.
4. Start the API in dev mode:
   ```bash
   pnpm dev
   ```

## Running the Worker

The worker executes workflow steps.

1. Navigate to the `apps/worker` directory.
2. Provide the `.env` file with database and AWS SQS queue URL configurations.
3. Start the worker:
   ```bash
   pnpm dev
   ```

## Running the Web Dashboard

1. Navigate to `apps/web`.
2. Start the Vite development server:
   ```bash
   pnpm dev
   ```
3. Visit `http://localhost:5173` to access the Workflow Builder UI.

## Teardown

To remove all demo AWS infrastructure:

```bash
cd infra/terraform/environments/example
terraform destroy
```
