resource "aws_sqs_queue" "dlq" {
  name                        = "${var.queue_name}-dlq${var.is_fifo ? ".fifo" : ""}"
  fifo_queue                  = var.is_fifo
  content_based_deduplication = var.is_fifo ? var.content_based_deduplication : null
  message_retention_seconds   = 1209600 # 14 days for DLQ

  tags = var.tags
}

resource "aws_sqs_queue" "main" {
  name                        = "${var.queue_name}${var.is_fifo ? ".fifo" : ""}"
  fifo_queue                  = var.is_fifo
  content_based_deduplication = var.is_fifo ? var.content_based_deduplication : null
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  message_retention_seconds   = var.message_retention_seconds
  receive_wait_time_seconds   = var.receive_wait_time_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = var.tags
}

resource "aws_sqs_queue_redrive_allow_policy" "dlq_redrive_allow" {
  queue_url = aws_sqs_queue.dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [aws_sqs_queue.main.arn]
  })
}
