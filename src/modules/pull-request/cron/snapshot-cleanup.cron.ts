import { Injectable } from '@nestjs/common';
import { SnapshotCleanupService } from '../service/sync/snapshot-cleanup/snapshot-cleanup.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class SnapshotCleanupCron {
  constructor(
    private readonly snapshotCleanupService: SnapshotCleanupService,
    @InjectPinoLogger(SnapshotCleanupCron.name)
    private readonly logger: PinoLogger,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanup(): Promise<void> {
    const deleted = await this.snapshotCleanupService.cleanupExpiredSnapshots();

    this.logger.info({
      message: 'Expired snapshots cleaned',
      deleted,
    });
  }
}
