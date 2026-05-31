import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { AppException } from '../../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../../exception-handling/exception-codes';
import { GithubInstallationTokenService } from '../../../../github-integration/service/github-installation-token.service';
import { LlmResponseDto } from '../../../../ai/dto/llm-response.dto';
import { PullRequestQueryService } from '../../query/pull-request-query/pull-request-query.service';
import {
  GithubPullRequestReviewComment,
  ReviewCommentInput,
} from '../../../dto/review/pr-review-comment.dto';

@Injectable()
export class GithubPrReviewCommentService {
  private readonly logger = new Logger(GithubPrReviewCommentService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly githubInstallationTokenService: GithubInstallationTokenService,
    private readonly pullRequestQueryService: PullRequestQueryService,
  ) {}

  async postReviewComments(
    pullRequestId: string,
    result: LlmResponseDto,
  ): Promise<void> {
    const comments = this.buildGithubComments(result);

    if (comments.length === 0) {
      this.logger.debug(
        `Skipping posting GitHub PR review comments for pullRequestId=${pullRequestId}: no valid comments`,
      );
      return;
    }

    const pullRequest =
      await this.pullRequestQueryService.findPullRequestByIdWithRepositoryAndInstallation(
        pullRequestId,
      );

    if (!pullRequest) {
      throw new AppException(
        ExceptionCodes.PR_PROCESSING_ERROR,
        'Pull request not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const repository = pullRequest.repository;
    const token = await this.githubInstallationTokenService.getToken(
      repository.installation.installationId,
    );

    try {
      await firstValueFrom(
        this.httpService.post(
          `https://api.github.com/repos/${repository.fullName}/pulls/${pullRequest.prNumber}/reviews`,
          {
            commit_id: pullRequest.headSha,
            event: 'COMMENT',
            comments,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          },
        ),
      );

      this.logger.debug(
        `Posted ${comments.length} GitHub review comments for pullRequestId=${pullRequestId}`,
      );
    } catch (error) {
      this.handleGithubError(error, repository.fullName, pullRequest.prNumber);
    }
  }

  private buildGithubComments(
    result: LlmResponseDto,
  ): GithubPullRequestReviewComment[] {
    return ((result.comments ?? []) as ReviewCommentInput[])
      .map((comment) => {
        const path = comment.filePath || comment.path;
        const line =
          comment.line ||
          comment.lineNumber ||
          comment.endLine ||
          comment.startLine;
        const body = (comment.comment || comment.message)?.trim();

        if (!path || !line || !body) {
          return null;
        }

        const githubComment: GithubPullRequestReviewComment = {
          path,
          line,
          side: 'RIGHT',
          body,
        };

        if (comment.startLine && comment.startLine < line) {
          githubComment.start_line = comment.startLine;
          githubComment.start_side = 'RIGHT';
        }

        return githubComment;
      })
      .filter(
        (comment): comment is GithubPullRequestReviewComment =>
          comment !== null,
      );
  }

  private handleGithubError(
    error: unknown,
    repositoryName: string,
    prNumber: number,
  ): never {
    if (error instanceof AxiosError) {
      this.logger.error({
        repositoryName,
        prNumber,
        status: error.response?.status,
        message: JSON.stringify(error.response?.data),
      });

      throw new AppException(
        ExceptionCodes.GITHUB_API_ERROR,
        'Failed to post GitHub pull request review comments',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    throw error;
  }
}
