variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_prefix" {
  description = "Prefix for all resources"
  type        = string
  default     = "eae-example"
}

variable "database_url" {
  description = "External PostgreSQL connection string"
  type        = string
}

variable "redis_url" {
  description = "External Redis connection string (optional)"
  type        = string
  default     = ""
}

variable "ses_from_email" {
  description = "Verified SES identity to send emails from"
  type        = string
}
