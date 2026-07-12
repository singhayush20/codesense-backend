import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ReviewResultsPayloadDto } from '../dto/review/review-results-payload.dto';
import { PrReviewResultService } from '../service/orchestration/pr-review-result/pr-review-result.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Processor('pull-request-review-results')
export class PullRequestReviewResultsProcessor extends WorkerHost {
  constructor(
    private readonly prReviewResultService: PrReviewResultService,
    @InjectPinoLogger(PullRequestReviewResultsProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async process(job: Job<ReviewResultsPayloadDto>): Promise<void> {
    const repositoryId = job.data.githubRepositoryId;
    const pullRequestId = job.data.pullRequestId;
    const result = job.data.result;
    const runId = job.data.runId;
    const provider = job.data.provider;

    this.logger.info(
      `Processing pr review results for repo: ${repositoryId}, pr: ${pullRequestId}, jobId: ${job.id}`,
    );

    await this.prReviewResultService.handlePrReviewResult(
      provider,
      pullRequestId,
      repositoryId,
      result,
      runId,
    );
  }
}
