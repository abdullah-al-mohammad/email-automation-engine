import { Module } from '@nestjs/common';

import { CacheModule } from './cache/cache.module';
import { ConfigAppModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [ConfigAppModule, DatabaseModule, QueueModule, CacheModule],
  exports: [ConfigAppModule, DatabaseModule, QueueModule, CacheModule],
})
export class InfrastructureModule {}
