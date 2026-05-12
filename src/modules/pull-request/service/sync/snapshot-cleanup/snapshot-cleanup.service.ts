import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PullRequestFileSnapshot } from '../../../entity/pull-request-file-snapshot.entity';

@Injectable()
export class SnapshotCleanupService {
  constructor(
    @InjectRepository(PullRequestFileSnapshot)
    private readonly snapshotRepository: Repository<PullRequestFileSnapshot>,
  ) {}

  async cleanupExpiredSnapshots(): Promise<number> {
    const result = await this.snapshotRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < NOW()')
      .execute();

    return result.affected ?? 0;
  }
}
