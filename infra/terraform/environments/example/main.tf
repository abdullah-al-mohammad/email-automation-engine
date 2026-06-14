data "archive_file" "worker_lambda" {
  type        = "zip"
  output_path = "${path.module}/worker_lambda.zip"
  source_dir  = "${path.module}/../../../../apps/worker/dist"
}

locals {
  common_env_vars = {
    NODE_ENV           = "production"
    DATABASE_URL       = var.database_url
    REDIS_URL          = var.redis_url
    FROM_EMAIL_ADDRESS = var.ses_from_email
  }
}

# ==========================================
# QUEUES
# ==========================================
module "automation_events_queue" {
  source     = "../../modules/sqs-queue"
  queue_name = "${var.project_prefix}-automation-events"
}

module "waiting_steps_queue" {
  source     = "../../modules/sqs-queue"
  queue_name = "${var.project_prefix}-waiting-contact-workflow-steps"
}

module "finished_steps_queue" {
  source     = "../../modules/sqs-queue"
  queue_name = "${var.project_prefix}-finished-contact-workflow-steps"
}

module "workflow_emails_queue" {
  source                      = "../../modules/sqs-queue"
  queue_name                  = "${var.project_prefix}-workflow-emails"
  is_fifo                     = true
  content_based_deduplication = true
}

module "email_tracking_events_queue" {
  source     = "../../modules/sqs-queue"
  queue_name = "${var.project_prefix}-email-tracking-events"
}

module "conditional_split_queue" {
  source                      = "../../modules/sqs-queue"
  queue_name                  = "${var.project_prefix}-conditional-split"
  is_fifo                     = true
  content_based_deduplication = true
}

module "webhook_steps_queue" {
  source                      = "../../modules/sqs-queue"
  queue_name                  = "${var.project_prefix}-webhook-steps"
  is_fifo                     = true
  content_based_deduplication = true
}

module "webhook_deliveries_queue" {
  source     = "../../modules/sqs-queue"
  queue_name = "${var.project_prefix}-webhook-deliveries"
}

# ==========================================
# LAMBDA WORKERS
# ==========================================
locals {
  worker_env_vars = merge(local.common_env_vars, {
    AUTOMATION_EVENTS_QUEUE_URL     = module.automation_events_queue.queue_url
    WAITING_STEPS_QUEUE_URL         = module.waiting_steps_queue.queue_url
    FINISHED_STEPS_QUEUE_URL        = module.finished_steps_queue.queue_url
    WORKFLOW_EMAILS_QUEUE_URL       = module.workflow_emails_queue.queue_url
    EMAIL_TRACKING_EVENTS_QUEUE_URL = module.email_tracking_events_queue.queue_url
    CONDITIONAL_SPLIT_QUEUE_URL     = module.conditional_split_queue.queue_url
    WEBHOOK_STEPS_QUEUE_URL         = module.webhook_steps_queue.queue_url
    WEBHOOK_DELIVERIES_QUEUE_URL    = module.webhook_deliveries_queue.queue_url
  })
}

module "worker_start_workflows" {
  source                = "../../modules/lambda-worker"
  function_name         = "${var.project_prefix}-start-workflows"
  handler               = "index.handler"
  filename              = data.archive_file.worker_lambda.output_path
  source_code_hash      = data.archive_file.worker_lambda.output_base64sha256
  environment_variables = local.worker_env_vars
  sqs_trigger_arn       = module.automation_events_queue.queue_arn
}

module "worker_start_workflow_steps" {
  source                = "../../modules/lambda-worker"
  function_name         = "${var.project_prefix}-start-workflow-steps"
  handler               = "index.handler"
  filename              = data.archive_file.worker_lambda.output_path
  source_code_hash      = data.archive_file.worker_lambda.output_base64sha256
  environment_variables = local.worker_env_vars
  sqs_trigger_arn       = module.waiting_steps_queue.queue_arn
}

module "worker_watch_workflow_steps" {
  source                = "../../modules/lambda-worker"
  function_name         = "${var.project_prefix}-watch-workflow-steps"
  handler               = "index.handler"
  filename              = data.archive_file.worker_lambda.output_path
  source_code_hash      = data.archive_file.worker_lambda.output_base64sha256
  environment_variables = local.worker_env_vars
  # No sqs_trigger_arn, this is triggered by EventBridge
}

module "worker_send_workflow_email" {
  source                = "../../modules/lambda-worker"
  function_name         = "${var.project_prefix}-send-workflow-email"
  handler               = "index.handler"
  filename              = data.archive_file.worker_lambda.output_path
  source_code_hash      = data.archive_file.worker_lambda.output_base64sha256
  environment_variables = local.worker_env_vars
  sqs_trigger_arn       = module.workflow_emails_queue.queue_arn
}

module "worker_conditional_split" {
  source                = "../../modules/lambda-worker"
  function_name         = "${var.project_prefix}-conditional-split"
  handler               = "handlers/conditional-split.handler"
  filename              = data.archive_file.worker_lambda.output_path
  source_code_hash      = data.archive_file.worker_lambda.output_base64sha256
  environment_variables = local.worker_env_vars
  sqs_trigger_arn       = module.conditional_split_queue.queue_arn
}

module "worker_webhook_steps" {
  source                = "../../modules/lambda-worker"
  function_name         = "${var.project_prefix}-webhook-steps"
  handler               = "handlers/webhook-steps.handler"
  filename              = data.archive_file.worker_lambda.output_path
  source_code_hash      = data.archive_file.worker_lambda.output_base64sha256
  environment_variables = local.worker_env_vars
  sqs_trigger_arn       = module.webhook_steps_queue.queue_arn
}

module "worker_email_tracking_events" {
  source                = "../../modules/lambda-worker"
  function_name         = "${var.project_prefix}-email-tracking-events"
  handler               = "handlers/email-tracking-events.handler"
  filename              = data.archive_file.worker_lambda.output_path
  source_code_hash      = data.archive_file.worker_lambda.output_base64sha256
  environment_variables = local.worker_env_vars
  sqs_trigger_arn       = module.email_tracking_events_queue.queue_arn
}

module "worker_webhook_deliveries" {
  source                = "../../modules/lambda-worker"
  function_name         = "${var.project_prefix}-webhook-deliveries"
  handler               = "handlers/webhook-deliveries.handler"
  filename              = data.archive_file.worker_lambda.output_path
  source_code_hash      = data.archive_file.worker_lambda.output_base64sha256
  environment_variables = local.worker_env_vars
  sqs_trigger_arn       = module.webhook_deliveries_queue.queue_arn
}

# Add IAM Policy for SES
resource "aws_iam_role_policy" "ses_send_email" {
  name = "${var.project_prefix}-ses-send-email"
  role = module.worker_send_workflow_email.role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# ==========================================
# SCHEDULE
# ==========================================
module "watch_delayed_steps_schedule" {
  source              = "../../modules/eventbridge-schedule"
  name                = "${var.project_prefix}-watch-delayed-steps"
  schedule_expression = "rate(1 minute)"
  target_arn          = module.worker_watch_workflow_steps.function_arn
}
