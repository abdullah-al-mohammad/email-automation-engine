import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_SERVICE } from './cache.interface';
import { RedisCacheAdapter } from './redis-cache.adapter';
import { InMemoryCacheAdapter } from './in-memory-cache.adapter';
import { CACHE_TYPE } from '../config/config-keys';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_SERVICE,
      useFactory: (configService: ConfigService) => {
        const cacheType = configService.get<string>(CACHE_TYPE);
        if (cacheType === 'redis') {
          return new RedisCacheAdapter(configService);
        }
        return new InMemoryCacheAdapter();
      },
      inject: [ConfigService],
    },
  ],
  exports: [CACHE_SERVICE],
})
export class CacheModule {}
