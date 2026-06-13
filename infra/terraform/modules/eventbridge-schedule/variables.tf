variable "name" {
  description = "Name of the EventBridge rule"
  type        = string
}

variable "schedule_expression" {
  description = "The scheduling expression (e.g., cron(0 20 * * ? *) or rate(5 minutes))"
  type        = string
}

variable "target_arn" {
  description = "The ARN of the Lambda function to invoke"
  type        = string
}

variable "target_input" {
  description = "Valid JSON text passed to the target. If empty, nothing is passed."
  type        = string
  default     = null
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}
