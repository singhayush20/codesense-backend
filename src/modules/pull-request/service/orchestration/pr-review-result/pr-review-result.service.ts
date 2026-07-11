import { Injectable, Logger } from '@nestjs/common';
import { LlmResponseDto } from '../../../../ai/dto/llm-response.dto';
import { ProviderType } from '../../../../ai/enums/provider.type';
import { GithubPrReviewCommentService } from '../../github/github-pr-review-comment/github-pr-review-comment.service';
import { PullRequestReviewService } from '../../pull-request-review/pull-request-review.service';
import { PullRequestReviewStatus } from '../../../enums/pull-request-review-status.enum';
import { ReviewWorkflowService } from '../review-workflow/review-workflow.service';
import { ReviewWorkflowStep } from '../../../enums/review-workflow-step.enum';

@Injectable()
export class PrReviewResultService {
  private readonly logger = new Logger(PrReviewResultService.name);

  constructor(
    private readonly pullRequestReviewService: PullRequestReviewService,
    private readonly githubPrReviewCommentService: GithubPrReviewCommentService,
    private readonly reviewWorkflowService: ReviewWorkflowService,
  ) {}

  async handlePrReviewResult(
    provider: ProviderType,
    pullRequestId: string,
    repositoryId: string,
    result: LlmResponseDto,
    runId: string,
  ): Promise<void> {
    await this.reviewWorkflowService.startStep(
      runId,
      ReviewWorkflowStep.SAVING_RESULTS,
    );

    try {
      const pullRequestReviewJob =
        await this.pullRequestReviewService.savePullRequestReview(
          runId,
          pullRequestId,
          provider,
          result,
          repositoryId,
        );

      this.logger.debug(
        `Saved pull request review job with ID: ${pullRequestReviewJob.id}, runId: ${pullRequestReviewJob.runId}`,
      );

      if (
        pullRequestReviewJob.status !== PullRequestReviewStatus.IN_PROGRESS ||
        !pullRequestReviewJob.result
      ) {
        this.logger.log(
          `Skipping comment posting for review run ${runId} with status ${pullRequestReviewJob.status}`,
        );
        await this.reviewWorkflowService.cancelStep(
          runId,
          ReviewWorkflowStep.SAVING_RESULTS,
          `Review run is ${pullRequestReviewJob.status}`,
        );
        return;
      }

      await this.githubPrReviewCommentService.postReviewComments(
        pullRequestId,
        result,
      );

      await this.reviewWorkflowService.completeStep(
        runId,
        ReviewWorkflowStep.SAVING_RESULTS,
      );
      await this.reviewWorkflowService.completeRun(runId);
    } catch (error) {
      await this.reviewWorkflowService.failStep(
        runId,
        ReviewWorkflowStep.SAVING_RESULTS,
        error,
      );
      await this.reviewWorkflowService.failRun(runId, error);
      throw error;
    }
  }
}
