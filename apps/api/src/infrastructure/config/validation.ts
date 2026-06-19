import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_ENCRYPTION_KEY: Joi.string().hex().length(64).required(),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).max(31).default(10),
  QUEUE_TYPE: Joi.string().valid('sqs', 'in-memory').default('in-memory'),
  CACHE_TYPE: Joi.string().valid('redis', 'in-memory').default('in-memory'),
  REDIS_URL: Joi.when('CACHE_TYPE', {
    is: 'redis',
    then: Joi.string().uri().required(),
    otherwise: Joi.string().uri().optional(),
  }),
  AWS_REGION: Joi.string().optional().default('us-east-1'),
  AWS_SQS_ENDPOINT_URL: Joi.string().uri().optional(),
  AUTOMATION_EVENTS_QUEUE_URL: Joi.string().default('automation-events'),
  WAITING_STEPS_QUEUE_URL: Joi.string().default('waiting-contact-workflow-steps'),
  FINISHED_STEPS_QUEUE_URL: Joi.string().default('finished-contact-workflow-steps'),
  EMAIL_TRACKING_EVENTS_QUEUE_URL: Joi.string().default('email-tracking-events'),
  ALLOWED_ORIGINS: Joi.string().default('*'),
});
