import {
  DATABASE_URL,
  NODE_ENV,
  PORT,
  JWT_SECRET,
  JWT_ENCRYPTION_KEY,
  BCRYPT_SALT_ROUNDS,
} from './config-keys';

export default () => ({
  [NODE_ENV]: process.env.NODE_ENV ?? 'development',
  [PORT]: Number(process.env.PORT ?? 3000),
  [DATABASE_URL]: process.env.DATABASE_URL,
  [JWT_SECRET]: process.env.JWT_SECRET,
  [JWT_ENCRYPTION_KEY]: process.env.JWT_ENCRYPTION_KEY,
  [BCRYPT_SALT_ROUNDS]: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
});
