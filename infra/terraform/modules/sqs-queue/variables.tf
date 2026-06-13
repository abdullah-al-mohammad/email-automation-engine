variable "queue_name" {
  description = "The name of the queue (without .fifo suffix)"
  type        = string
}

variable "is_fifo" {
  description = "Whether this is a FIFO queue"
  type        = bool
  default     = false
}

variable "content_based_deduplication" {
  description = "Enable content-based deduplication for FIFO queues"
  type        = bool
  default     = false
}

variable "visibility_timeout_seconds" {
  description = "The visibility timeout for the queue (should be > Lambda timeout)"
  type        = number
  default     = 30
}

variable "message_retention_seconds" {
  description = "The number of seconds Amazon SQS retains a message"
  type        = number
  default     = 345600 # 4 days
}

variable "receive_wait_time_seconds" {
  description = "The time for which a ReceiveMessage call will wait for a message to arrive (Long Polling)"
  type        = number
  default     = 20
}

variable "max_receive_count" {
  description = "The maximum number of times a message can be received before being sent to the DLQ"
  type        = number
  default     = 3
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}
