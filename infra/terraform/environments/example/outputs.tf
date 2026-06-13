output "automation_events_queue_url" {
  value = module.automation_events_queue.queue_url
}

output "start_workflows_lambda_arn" {
  value = module.worker_start_workflows.function_arn
}
