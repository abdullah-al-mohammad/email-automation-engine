variable "project_name" {
  description = "Product-neutral project name used for resource prefixes."
  type        = string
  default     = "email-automation-engine"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "development"
}
