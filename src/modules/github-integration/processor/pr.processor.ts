import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GithubPullRequestEventPayload } from '../dtos/pr-handling/github-pr.dto';
import { PrWorkflowService } from '../../pull-request/service/orchestration/pr-workflow/pr-workflow.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Processor('pr-processing')
export class PrProcessor extends WorkerHost {
  constructor(
    private readonly prWorkflowService: PrWorkflowService,
    @InjectPinoLogger(PrProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async process(
    job: Job<{ payload: GithubPullRequestEventPayload }>,
  ): Promise<void> {
    try {
      await this.prWorkflowService.processPullRequest(job.data.payload);
    } catch (error) {
      this.logger.error({ err: error }, 'PR workflow failed');
      throw error;
    }
  }
}
