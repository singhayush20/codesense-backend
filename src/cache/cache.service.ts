import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class CacheService {
  private readonly logger: Logger;

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
      return JSON.parse(data) as T;
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

  async setIfNotExists(
    key: string,
    value: any,
    ttlSeconds?: number,
  ): Promise<boolean> {
    const serialized = JSON.stringify(value);
    let result;

    if (ttlSeconds) {
      // add jitter to prevent stampede
      const ttl = ttlSeconds + Math.floor(Math.random() * 30);
      // atomic set with NX and EX options to ensure lock is set only if not exists and has an expiration
      result = await this.client.set(key, serialized, 'EX', ttl, 'NX');
    } else {
      result = await this.client.set(key, serialized, 'NX');
    }

    return result === 'OK';
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
