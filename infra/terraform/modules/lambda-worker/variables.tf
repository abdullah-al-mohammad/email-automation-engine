variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "handler" {
  description = "The Lambda function handler"
  type        = string
}

variable "filename" {
  description = "Path to the deployment package within the local filesystem"
  type        = string
}

variable "source_code_hash" {
  description = "Base64-encoded representation of raw SHA-256 sum of the zip file"
  type        = string
  default     = null
}

variable "timeout" {
  description = "The amount of time your Lambda Function has to run in seconds"
  type        = number
  default     = 15
}

variable "memory_size" {
  description = "Amount of memory in MB your Lambda Function can use at runtime"
  type        = number
  default     = 256
}

variable "environment_variables" {
  description = "A map that defines environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "sqs_trigger_arn" {
  description = "ARN of an SQS queue to trigger this Lambda (optional)"
  type        = string
  default     = null
}

variable "batch_size" {
  description = "The largest number of records that Lambda will retrieve from your event source at the time of invoking your function"
  type        = number
  default     = 10
}

variable "subnet_ids" {
  description = "List of subnet IDs associated with the Lambda function"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "List of security group IDs associated with the Lambda function"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}
