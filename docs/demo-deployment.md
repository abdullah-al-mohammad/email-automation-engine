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

## Database Setup & Environment Configuration

1. **Spin up PostgreSQL locally** using Docker:

   ```bash
   docker run --name eae-postgres -e POSTGRES_USER=engine_user -e POSTGRES_PASSWORD=engine_password -e POSTGRES_DB=engine_db -p 5432:5432 -d postgres:15-alpine
   ```

2. **Set up the Environment File**:
   From the root directory, copy `.env.example` to create `.env`:

   ```bash
   cp .env.example .env
   ```

   Open the `.env` file and configure:
   - `DATABASE_URL` (e.g., `postgres://engine_user:engine_password@localhost:5432/engine_db`)
   - AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)
   - The SQS Queue URLs output by Terraform under `# AWS SQS Queue URLs`
   - `FROM_EMAIL_ADDRESS` (verified email in AWS SES)

3. **Install dependencies and build the monorepo packages**:
   From the root directory, run:
   ```bash
   pnpm install
   pnpm build
   ```

## Database Migrations

Before launching the services, you must initialize the database schema:

```bash
pnpm --filter @email-automation-engine/api migration:run
```

## Running the Services

You can start the API, worker, and web dashboard together in development mode from the root directory:

```bash
pnpm dev
```

_Note: If you prefer to run them in separate terminal tabs, you can navigate to `apps/api`, `apps/worker`, and `apps/web` respectively and run `pnpm dev` in each._

## Verifying the Services

To confirm everything is up and running correctly:

1. **Check the API health endpoint**:

   ```bash
   curl http://localhost:3000/health
   ```

   **Expected Response**:

   ```json
   {
     "status": "ok",
     "service": "api"
   }
   ```

2. **Access the Web Interface**:
   Open your browser and navigate to `http://localhost:5173`. You should see the workflow builder dashboard.

3. **Check logs**:
   Ensure no database connection errors or AWS credentials validation failures appear in your API/worker logs.

## Teardown

To remove all demo AWS infrastructure:

```bash
cd infra/terraform/environments/example
terraform destroy
```
