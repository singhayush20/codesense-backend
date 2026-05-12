import { Injectable, Logger } from "@nestjs/common";
import { SnapshotCleanupService } from "../service/sync/snapshot-cleanup/snapshot-cleanup.service";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class SnapshotCleanupCron {
  private readonly logger = new Logger(SnapshotCleanupCron.name);

  constructor(
    private readonly snapshotCleanupService: SnapshotCleanupService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanup(): Promise<void> {
    const deleted = await this.snapshotCleanupService.cleanupExpiredSnapshots();

    this.logger.log({
      message: 'Expired snapshots cleaned',
      deleted,
    });
  }
}
