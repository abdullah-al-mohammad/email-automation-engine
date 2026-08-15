import { ConfigService } from '@nestjs/config';
import { type TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { DATABASE_URL } from '../config/config-keys';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    url: config.getOrThrow<string>(DATABASE_URL),
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: false,
    namingStrategy: new SnakeNamingStrategy(),
  }),
};
