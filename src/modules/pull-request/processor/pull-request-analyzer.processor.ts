import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrAnalyzerDto } from '../dto/queue-payload/pr-analyzer-payload.dto';
import { Logger } from '@nestjs/common';
import { AiReviewService } from '../service/orchestration/ai-review/ai-review.service';

@Processor('code-review')
export class PullRequestAnalyzerProcessor extends WorkerHost {
  private readonly logger = new Logger(PullRequestAnalyzerProcessor.name);

  constructor(private readonly aiReviewService: AiReviewService) {
    super();
  }

  async process(job: Job<PrAnalyzerDto>): Promise<void> {
    try {
      this.logger.log(
        `Processing pr analyzer job: ${job.id}, job data: ${JSON.stringify(job.data)}`,
      );

      await this.aiReviewService.handleAiReview(job.data);

      this.logger.log(`Finished job: ${job.id}`);
    } catch (error) {
      this.logger.error(
        `Job failed: ${job.id}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }
}
