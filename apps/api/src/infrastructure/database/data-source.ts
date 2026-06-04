import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  migrationsRun: false,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [path.join(__dirname, '../../modules/**/*.aggregate.{ts,js}')],
  migrations: [path.join(__dirname, './migrations/*.{ts,js}')],
});
