import { Module } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ConfigAppModule, DatabaseModule],
  exports: [ConfigAppModule, DatabaseModule],
})
export class InfrastructureModule {}
