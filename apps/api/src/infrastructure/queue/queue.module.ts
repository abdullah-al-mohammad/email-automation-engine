import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QUEUE_SERVICE } from './queue.interface';
import { SqsQueueAdapter } from './sqs-queue.adapter';
import { InMemoryQueueAdapter } from './in-memory-queue.adapter';
import { QUEUE_TYPE } from '../config/config-keys';

@Global()
@Module({
  providers: [
    {
      provide: QUEUE_SERVICE,
      useFactory: (configService: ConfigService) => {
        const queueType = configService.get<string>(QUEUE_TYPE);
        if (queueType === 'sqs') {
          return new SqsQueueAdapter(configService);
        }
        return new InMemoryQueueAdapter();
      },
      inject: [ConfigService],
    },
  ],
  exports: [QUEUE_SERVICE],
})
export class QueueModule {}
