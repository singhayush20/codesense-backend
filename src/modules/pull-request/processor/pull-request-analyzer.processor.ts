import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrAnalyzerDto } from '../dto/queue-payload/pr-analyzer-payload.dto';
import { AiReviewService } from '../service/orchestration/ai-review/ai-review.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Processor('code-review')
export class PullRequestAnalyzerProcessor extends WorkerHost {
  constructor(
    private readonly aiReviewService: AiReviewService,
    @InjectPinoLogger(PullRequestAnalyzerProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async process(job: Job<PrAnalyzerDto>): Promise<void> {
    try {
      this.logger.info(
        `Processing pr analyzer job: ${job.id}, job data: ${JSON.stringify(job.data)}`,
      );

      await this.aiReviewService.handleAiReview(job.data);

      this.logger.info(`Finished job: ${job.id}`);
    } catch (error) {
      this.logger.error({ err: error }, `Job failed: ${job.id}`);

      throw error;
    }
  }
}
