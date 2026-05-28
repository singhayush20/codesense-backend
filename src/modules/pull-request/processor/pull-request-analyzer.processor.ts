import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrAnalyzerDto } from '../dto/queue-payload/pr-analyzer-payload.dto';
import { Logger } from '@nestjs/common';
import { AiReviewService } from '../service/orchestration/ai-review/ai-review.service';

@Processor('pr-analyzer')
export class PullRequestAnalyzerProcessor extends WorkerHost {
  private readonly logger = new Logger(PullRequestAnalyzerProcessor.name);

  constructor(private readonly aiReviewService: AiReviewService) {
    super();
  }

  async process(job: Job<{ payload: PrAnalyzerDto }>): Promise<void> {
    this.logger.log(`Processing pr analyzer job: ${job.id} - ${job.id}`);

    await this.aiReviewService.handleAiReview(job.data.payload);
  }
}
