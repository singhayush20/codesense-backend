import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from './redis/redis.service';

@Injectable()
export class CacheService {
  private readonly logger;

  constructor(private readonly redisService: RedisService) {
    this.logger = new Logger(CacheService.name);
  }

  private get client() {
    return this.redisService.getClient();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);

    if (data) {
      this.logger.debug(`[CACHE HIT] ${key}`);

      return JSON.parse(data);
    }

    this.logger.debug(`[CACHE MISS] ${key}`);

    return null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (ttlSeconds) {
      // add jitter to prevent stampede
      const ttl = ttlSeconds + Math.floor(Math.random() * 30);

      await this.client.set(key, serialized, 'EX', ttl);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);

    return result === 1;
  }
}
