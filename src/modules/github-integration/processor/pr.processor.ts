import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GithubPullRequestEventPayload } from '../dtos/pr-handling/github-pr.dto';
import { PrWorkflowService } from '../../pull-request/service/orchestration/pr-workflow/pr-workflow.service';

@Processor('pr-processing')
export class PrProcessor extends WorkerHost {
  private readonly logger = new Logger(PrProcessor.name);

  constructor(private readonly prWorkflowService: PrWorkflowService) {
    super();
  }

  async process(
    job: Job<{ payload: GithubPullRequestEventPayload }>,
  ): Promise<void> {
    try {
      await this.prWorkflowService.processPullRequest(job.data.payload);
    } catch (error) {
      this.logger.error('PR workflow failed', error);
      throw error;
    }
  }
}
