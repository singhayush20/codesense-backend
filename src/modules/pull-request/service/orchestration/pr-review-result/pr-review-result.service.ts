import { Injectable, Logger } from '@nestjs/common';
import { LlmResponseDto } from '../../../../ai/dto/llm-response.dto';
import { ProviderType } from '../../../../ai/enums/provider.type';
import { GithubPrReviewCommentService } from '../../github/github-pr-review-comment/github-pr-review-comment.service';
import { PullRequestReviewService } from '../../pull-request-review/pull-request-review.service';

@Injectable()
export class PrReviewResultService {
  private readonly logger = new Logger(PrReviewResultService.name);

  constructor(
    private readonly pullRequestReviewService: PullRequestReviewService,
    private readonly githubPrReviewCommentService: GithubPrReviewCommentService,
  ) {}

  async handlePrReviewResult(
    provider: ProviderType,
    pullRequestId: string,
    repositoryId: string,
    result: LlmResponseDto,
    runId: string,
  ): Promise<void> {
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
    await this.githubPrReviewCommentService.postReviewComments(
      pullRequestId,
      result,
    );
  }
}
