import * as dotenv from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const WorkerConfigSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgres://postgres:postgres@localhost:5432/email_automation'),
  REDIS_URL: z.string().min(1).optional(),
  AWS_REGION: z.string().min(1).default('us-east-1'),

  // Queues
  WAITING_STEPS_QUEUE_URL: z.string().min(1).default('waiting-contact-workflow-steps'),
  WORKFLOW_EMAILS_QUEUE_URL: z.string().min(1).default('workflow-emails.fifo'),
  CONDITIONAL_SPLIT_QUEUE_URL: z.string().min(1).default('conditional-split.fifo'),
  WEBHOOK_STEPS_QUEUE_URL: z.string().min(1).default('webhook-steps.fifo'),
  FINISHED_STEPS_QUEUE_URL: z.string().min(1).default('finished-contact-workflow-steps'),
  AUTOMATION_EVENTS_QUEUE_URL: z.string().min(1).default('automation-events'),
  EMAIL_TRACKING_EVENTS_QUEUE_URL: z.string().min(1).default('email-tracking-events'),
  WEBHOOK_DELIVERIES_QUEUE_URL: z.string().min(1).default('webhook-deliveries'),
  FROM_EMAIL_ADDRESS: z.string().min(1).default('noreply@example.com'),
});

export type WorkerConfig = z.infer<typeof WorkerConfigSchema>;

export function validateWorkerConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): WorkerConfig {
  const result = WorkerConfigSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Worker configuration validation failed: ${errors}`);
  }

  return result.data;
}

export const workerConfig = validateWorkerConfig(process.env);
