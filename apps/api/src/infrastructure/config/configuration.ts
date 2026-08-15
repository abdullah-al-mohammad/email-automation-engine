import {
  AUTOMATION_EVENTS_QUEUE_URL,
  AWS_REGION,
  AWS_SQS_ENDPOINT_URL,
  BCRYPT_SALT_ROUNDS,
  CACHE_TYPE,
  DATABASE_URL,
  FINISHED_STEPS_QUEUE_URL,
  JWT_ENCRYPTION_KEY,
  JWT_SECRET,
  NODE_ENV,
  PORT,
  QUEUE_TYPE,
  REDIS_URL,
  WAITING_STEPS_QUEUE_URL,
} from './config-keys';

export default () => ({
  [NODE_ENV]: process.env.NODE_ENV ?? 'development',
  [PORT]: Number(process.env.PORT ?? 3000),
  [DATABASE_URL]: process.env.DATABASE_URL,
  [JWT_SECRET]: process.env.JWT_SECRET,
  [JWT_ENCRYPTION_KEY]: process.env.JWT_ENCRYPTION_KEY,
  [BCRYPT_SALT_ROUNDS]: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  [QUEUE_TYPE]: process.env.QUEUE_TYPE ?? 'in-memory',
  [CACHE_TYPE]: process.env.CACHE_TYPE ?? 'in-memory',
  [REDIS_URL]: process.env.REDIS_URL,
  [AWS_REGION]: process.env.AWS_REGION ?? 'us-east-1',
  [AWS_SQS_ENDPOINT_URL]: process.env.AWS_SQS_ENDPOINT_URL,
  [AUTOMATION_EVENTS_QUEUE_URL]: process.env.AUTOMATION_EVENTS_QUEUE_URL ?? 'automation-events',
  [WAITING_STEPS_QUEUE_URL]:
    process.env.WAITING_STEPS_QUEUE_URL ?? 'waiting-contact-workflow-steps',
  [FINISHED_STEPS_QUEUE_URL]:
    process.env.FINISHED_STEPS_QUEUE_URL ?? 'finished-contact-workflow-steps',
});
