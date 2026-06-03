import {
  DATABASE_URL,
  NODE_ENV,
  PORT,
  JWT_SECRET,
  JWT_ENCRYPTION_KEY,
  BCRYPT_SALT_ROUNDS,
  QUEUE_TYPE,
  CACHE_TYPE,
  REDIS_URL,
  AWS_REGION,
  AWS_SQS_ENDPOINT_URL,
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
});
