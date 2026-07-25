# Production Cloud Deployment Guide

This guide outlines the architecture and deployment process for running the Email Automation Engine in a production-ready cloud environment (AWS).

---

## Architecture Overview

For a reliable, scalable production setup, the services are distributed as follows:

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

1. **Frontend (apps/web)**: Static React build hosted on **AWS S3** and distributed globally via **AWS CloudFront**.
2. **API Backend (apps/api)**: Containerized NestJS application running on **AWS ECS (Fargate)** behind an **Application Load Balancer (ALB)**.
3. **Workers (apps/worker)**: Serverless TypeScript event handlers running on **AWS Lambda**, triggered by **AWS SQS** and scheduled by **AWS EventBridge**.
4. **Database & Cache**: **AWS RDS PostgreSQL** and **AWS ElastiCache Redis**.

---

## 1. Prerequisites & Setup

Ensure you have the following installed and configured:
* An **AWS Account** with administrator permissions.
* **AWS CLI** configured with appropriate credentials.
* **Terraform CLI** (v1.5+).
* **Docker** installed locally (for containerizing the API backend).
* **Node.js 24** and **pnpm** installed.

---

## 2. Infrastructure Provisioning (Terraform)

The core queue and worker resources are defined under `infra/terraform`. 

### Step A: Configure Environment Variables
Navigate to the Terraform example environment:
```bash
cd infra/terraform/environments/example
```

Copy the example variables file:
```bash
cp terraform.example.tfvars terraform.tfvars
```

Edit `terraform.tfvars` and provide your production connections:
```hcl
aws_region      = "us-east-1"
project_prefix  = "eae-prod"
database_url    = "postgresql://db_user:db_password@your-rds-endpoint:5432/db_name"
redis_url       = "redis://your-elasticache-endpoint:6379"
ses_from_email  = "noreply@yourdomain.com"
```

### Step B: Build Worker Packages
Before deploying the Lambdas, you must build the TypeScript worker packages so Terraform can archive and upload the build directory:
```bash
# From root directory
pnpm install
pnpm build
```

### Step C: Deploy
Initialize and apply the Terraform configuration:
```bash
terraform init
terraform apply
```
*Take note of the output variables, specifically the **SQS Queue URLs** and **Lambda IAM Roles**.*

---

## 3. Database Migration
To run migrations against your production AWS RDS instance, run the following command from the root directory (ensure your network/security groups allow database access from your local machine, or run this step from a bastion host / CI pipeline):

```bash
DATABASE_URL="postgresql://db_user:db_password@your-rds-endpoint:5432/db_name" pnpm --filter @email-automation-engine/api migration:run
```

---

## 4. Deploying the API Backend (AWS ECS / Fargate)

Since the NestJS API is a persistent process handling incoming REST traffic, we recommend containerizing it.

### Step A: Dockerize the NestJS API
Create a production `Dockerfile` in `apps/api/Dockerfile`:

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

### Step B: Build and Push to AWS ECR
Create an AWS ECR repository and push the image:
```bash
aws ecr create-repository --repository-name email-automation-engine-api

# Authenticate Docker to your ECR registry
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t email-automation-engine-api -f apps/api/Dockerfile .
docker tag email-automation-engine-api:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/email-automation-engine-api:latest

# Push
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/email-automation-engine-api:latest
```

### Step C: Launch ECS Task
Deploy a Fargate Service with the ECR image, passing the required environment variables (`DATABASE_URL`, `REDIS_URL`, and the SQS Queue URLs obtained from the Terraform outputs).

---

## 5. Deploying the Frontend (AWS S3 + CloudFront)

The frontend React dashboard is built as a static site and can be served through a CDN.

### Step A: Build Static Files
From the project root, build the web application:
```bash
# Configure the API URL that the frontend should target
VITE_API_BASE_URL="https://api.yourdomain.com" pnpm --filter @email-automation-engine/web build
```
This generates the static assets in `apps/web/dist`.

### Step B: Deploy to S3 & Invalidate CloudFront
Create an S3 bucket configured for static website hosting, then upload the build folder:
```bash
# Sync files to S3
aws s3 sync apps/web/dist/ s3://your-frontend-bucket-name/ --delete

# Invalidate CloudFront cache to serve the new files immediately
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## 6. Teardown & Maintenance

To completely destroy the AWS resource stack managed by Terraform:
```bash
cd infra/terraform/environments/example
terraform destroy
```
*Note: This will not delete resources created outside of Terraform, such as ECS clusters, RDS instances, S3 frontend buckets, or ECR images.*
