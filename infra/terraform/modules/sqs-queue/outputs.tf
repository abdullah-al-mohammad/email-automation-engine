output "queue_url" {
  description = "The URL of the created SQS queue"
  value       = aws_sqs_queue.main.url
}

output "queue_arn" {
  description = "The ARN of the created SQS queue"
  value       = aws_sqs_queue.main.arn
}

output "dlq_url" {
  description = "The URL of the created Dead Letter Queue"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "The ARN of the created Dead Letter Queue"
  value       = aws_sqs_queue.dlq.arn
}
