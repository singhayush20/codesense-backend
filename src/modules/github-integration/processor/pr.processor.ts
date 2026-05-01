import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { GithubPullRequestEventPayload } from '../dtos/pr-handling/github-pr.dto';
import { PrProcessingService } from '../service/pr-processing/pr-processing.service';

@Processor('pr-processing')
export class PrProcessor extends WorkerHost {
  private readonly logger = new Logger(PrProcessor.name);

  constructor(private readonly prService: PrProcessingService) {
    super();
  }

  async process(
    job: Job<{ payload: GithubPullRequestEventPayload }>,
  ): Promise<void> {
    try {
      if (job.name !== 'process-pr') {
        return;
      }

      this.logger.log(`Processing job ${job.id}`);

      await this.prService.processPullRequest(job.data.payload);
    } catch (error) {
      this.logger.error(`Job failed: ${job.id}`, error);

      throw error;
    }
  }
}
