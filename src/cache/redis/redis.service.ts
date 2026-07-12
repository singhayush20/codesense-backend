import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.client = new Redis({
      host: configService.get<string>('cache.redis.host'),
      port: configService.get<number>('cache.redis.port'),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn({ retryAttempt: times, delay }, 'redis reconnecting');
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error({ err }, 'redis error');
    });

    this.client.on('close', () => {
      this.logger.warn('redis connection closed');
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('redis client quit');
  }
}
