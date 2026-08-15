import { describe, expect, it } from 'vitest';

import { validationSchema } from './validation';

describe('Config Validation', () => {
  it('should validate successfully in development mode when required fields are provided', () => {
    const result = validationSchema.validate({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgres://localhost:5432/dev',
      JWT_SECRET: 'dev-secret',
      JWT_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    });
    expect(result.error).toBeUndefined();
    expect(result.value.JWT_SECRET).toBe('dev-secret');
  });

  it('should fail validation if JWT_SECRET and JWT_ENCRYPTION_KEY are missing', () => {
    const result = validationSchema.validate(
      {
        NODE_ENV: 'development',
      },
      { abortEarly: false },
    );
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('"JWT_SECRET" is required');
    expect(result.error?.message).toContain('"JWT_ENCRYPTION_KEY" is required');
  });

  it('should fail validation in production mode if DATABASE_URL is missing', () => {
    const result = validationSchema.validate(
      {
        NODE_ENV: 'production',
        JWT_SECRET: 'prod-secret',
        JWT_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      },
      { abortEarly: false },
    );
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('"DATABASE_URL" is required');
  });

  it('should validate successfully in production mode when all required fields are provided', () => {
    const result = validationSchema.validate({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://localhost:5432/db',
      JWT_SECRET: 'prod-secret',
      JWT_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    });
    expect(result.error).toBeUndefined();
    expect(result.value.DATABASE_URL).toBe('postgres://localhost:5432/db');
    expect(result.value.JWT_SECRET).toBe('prod-secret');
  });

  it('applies queue and cache defaults', () => {
    const result = validationSchema.validate({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgres://localhost:5432/dev',
      JWT_SECRET: 'dev-secret',
      JWT_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    });

    expect(result.error).toBeUndefined();
    expect(result.value.QUEUE_TYPE).toBe('in-memory');
    expect(result.value.CACHE_TYPE).toBe('in-memory');
    expect(result.value.AWS_REGION).toBe('us-east-1');
  });

  it('requires REDIS_URL when redis cache is selected', () => {
    const result = validationSchema.validate(
      {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgres://localhost:5432/dev',
        JWT_SECRET: 'dev-secret',
        JWT_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        CACHE_TYPE: 'redis',
      },
      { abortEarly: false },
    );

    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('"REDIS_URL" is required');
  });
});
