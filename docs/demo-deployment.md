# Production Cloud Deployment Guide

This guide covers how to run the Email Automation Engine in production on AWS.

---

## Architecture Overview

The system is split across managed AWS services:

| Component | Hosting |
| --- | --- |
| Frontend (`apps/web`) | Static React build on S3, served via CloudFront |
| API backend (`apps/api`) | NestJS container on ECS (Fargate) behind an ALB |
| Workers (`apps/worker`) | TypeScript handlers on Lambda, triggered by SQS and EventBridge |
| Database & cache | RDS PostgreSQL and ElastiCache Redis |

```mermaid
graph TD
    User([User / Browser]) -->|Web UI| CloudFront[AWS CloudFront / S3]
    User -->|API Requests| ALB[Application Load Balancer]
    ALB -->|Route traffic| ECS[AWS ECS / Fargate - API Service]
    ECS -->|Ingest Events / Jobs| SQS[AWS SQS Queues]
    SQS -->|Triggers| Lambda[AWS Lambda - Workers]
    Lambda -->|Send Emails| SES[AWS SES]

    ECS -->|Read/Write| RDS[(AWS RDS PostgreSQL)]
    Lambda -->|Read/Write| RDS

    ECS -->|Cache/Idempotency| ElastiCache[(AWS ElastiCache Redis)]
    Lambda -->|Cache/Idempotency| ElastiCache
```

---

## 1. Prerequisites

Make sure you have:

- An **AWS account** with administrator permissions
- **AWS CLI** configured with credentials
- **Terraform** (v1.5+)
- **Docker** for containerizing the API backend
- **Node.js 24** and **pnpm**

---

## 2. Provision Infrastructure with Terraform

The queue and worker resources are defined in `infra/terraform`.

### Step A: Configure variables

```bash
cd infra/terraform/environments/example
cp terraform.example.tfvars terraform.tfvars
```

Edit `terraform.tfvars` with your production values:

```hcl
aws_region      = "us-east-1"
project_prefix  = "eae-prod"
database_url    = "postgresql://db_user:db_password@your-rds-endpoint:5432/db_name"
redis_url       = "redis://your-elasticache-endpoint:6379"
ses_from_email  = "noreply@yourdomain.com"
```

### Step B: Build worker packages

The Lambda worker packages must be built first so Terraform can archive and upload the output:

```bash
# From the project root
pnpm install
pnpm build
```

### Step C: Apply

```bash
terraform init
terraform apply
```

_Note the output variables, especially the **SQS Queue URLs** and **Lambda IAM Roles** — you'll need them when deploying the API._

---

## 3. Run Database Migrations

Run migrations against your production RDS instance (your local machine must be able to reach the database, or run this from a bastion host / CI pipeline):

```bash
DATABASE_URL="postgresql://db_user:db_password@your-rds-endpoint:5432/db_name" \
  pnpm --filter @email-automation-engine/api migration:run
```

---

## 4. Deploy the API Backend (ECS / Fargate)

The NestJS API is a long-running process that handles REST traffic, so it runs as a container.

### Step A: Create a Dockerfile

Create `apps/api/Dockerfile`:

```dockerfile
FROM node:24-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @email-automation-engine/shared build
RUN pnpm --filter @email-automation-engine/api build

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Step B: Build and push to ECR

```bash
aws ecr create-repository --repository-name email-automation-engine-api

# Authenticate Docker to your ECR registry
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com

# Build, tag, and push
docker build -t email-automation-engine-api -f apps/api/Dockerfile .
docker tag email-automation-engine-api:latest \
  <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/email-automation-engine-api:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/email-automation-engine-api:latest
```

### Step C: Launch the ECS task

Deploy a Fargate service using the ECR image and pass the required environment variables: `DATABASE_URL`, `REDIS_URL`, and the SQS Queue URLs from the Terraform outputs.

---

## 5. Deploy the Frontend (S3 + CloudFront)

The React dashboard is built as a static site and served through a CDN.

### Step A: Build the static files

```bash
# From the project root, set the API URL the frontend should call
VITE_API_BASE_URL="https://api.yourdomain.com" \
  pnpm --filter @email-automation-engine/web build
```

This generates the static assets in `apps/web/dist`.

### Step B: Upload to S3 and invalidate CloudFront

```bash
# Sync files to S3
aws s3 sync apps/web/dist/ s3://your-frontend-bucket-name/ --delete

# Invalidate the CloudFront cache to serve new files immediately
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## 6. Teardown

To destroy the resources managed by Terraform:

```bash
cd infra/terraform/environments/example
terraform destroy
```

_Resources created outside Terraform — ECS clusters, RDS instances, S3 buckets, and ECR images — are not affected._
