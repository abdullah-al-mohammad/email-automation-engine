import { DATABASE_URL, NODE_ENV, PORT } from './config-keys';

export default () => ({
  [NODE_ENV]: process.env.NODE_ENV ?? 'development',
  [PORT]: Number(process.env.PORT ?? 3000),
  [DATABASE_URL]: process.env.DATABASE_URL,
});
