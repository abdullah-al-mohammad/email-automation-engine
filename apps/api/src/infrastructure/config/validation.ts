import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_ENCRYPTION_KEY: Joi.string().hex().length(64).required(),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).max(31).default(10),
});
