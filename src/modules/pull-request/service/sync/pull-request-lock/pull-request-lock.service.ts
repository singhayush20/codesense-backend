import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../../../cache/cache.service';

/**
 * This service will be used to manage locks for pull request processing to ensure that only one process is handling a
 * pull request at any given time. This is important to prevent race conditions and ensure data consistency when
 * multiple events related to the same pull request are received in quick succession. This is important to manage
 * multiple events like:
 * 1. duplicate syncs
 * 2. concurrent ai processing
 * 3. duplicate webhook processing
 */
@Injectable()
export class PullRequestLockService {
  constructor(private readonly cacheService: CacheService) {}

  buildLockKey(repositoryId: string, prNumber: number): string {
    return `pr:sync:${repositoryId}:${prNumber}`;
  }

  async acquireLock(key: string, ttlSeconds = 300): Promise<boolean> {
    return this.cacheService.setIfNotExists(key, 'locked', ttlSeconds);
  }

  async releaseLock(lockKey: string) {
    await this.cacheService.delete(lockKey);
  }
}
