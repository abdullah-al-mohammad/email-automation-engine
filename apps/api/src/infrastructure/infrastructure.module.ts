import { Module } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [ConfigAppModule, DatabaseModule, QueueModule, CacheModule],
  exports: [ConfigAppModule, DatabaseModule, QueueModule, CacheModule],
})
export class InfrastructureModule {}
