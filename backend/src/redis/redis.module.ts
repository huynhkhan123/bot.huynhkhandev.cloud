import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Redis = require('ioredis');
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          // Redis Cloud / external Redis — connect via URL
          return new Redis(redisUrl, { tls: redisUrl.startsWith('rediss://') ? {} : undefined });
        }
        // Local Redis fallback
        return new Redis({
          host: config.get('REDIS_HOST', 'redis'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}

