import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { AppException } from '../../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../../exception-handling/exception-codes';
import { GithubInstallationTokenService } from '../../../../github-integration/service/github-installation-token.service';
import { LlmResponseDto } from '../../../../ai/dto/llm-response.dto';
import { PullRequestQueryService } from '../../query/pull-request-query/pull-request-query.service';
import { GithubPullRequestReviewComment } from '../../../dto/review/pr-review-comment.dto';
import { GithubPrApiService } from '../github-pr-api/github-pr-api.service';
import { GithubPullRequestFileResponse } from '../../../dto/pull-request/github-pull-request-file-response.dto';
import { AIReviewComment } from '../../../../ai/schema/ai-review-comment.scehma';

interface ReviewCommentBuildContext {
  pullRequestId: string;
  repositoryName: string;
  prNumber: number;
  headSha: string;
}

@Injectable()
export class GithubPrReviewCommentService {
  private readonly logger = new Logger(GithubPrReviewCommentService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly githubInstallationTokenService: GithubInstallationTokenService,
    private readonly pullRequestQueryService: PullRequestQueryService,
    private readonly githubPrApiService: GithubPrApiService,
  ) {}

  async postReviewComments(
    pullRequestId: string,
    result: LlmResponseDto,
  ): Promise<void> {
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

    // TODO: refactor to make the handling more robust for cases where remote file changed during pr review, this can give a different version of file content than what was used for generating comments, which can make the comments unpostable. In that case either log, or update job run status, to handle elegantly and let the user know about it, instead of just skipping posting comments.

    const pullRequestFiles =
      await this.githubPrApiService.fetchPullRequestFiles(
        repository,
        pullRequest.prNumber,
      );
    const comments = this.buildGithubComments(result, pullRequestFiles, {
      pullRequestId,
      repositoryName: repository.fullName,
      prNumber: pullRequest.prNumber,
      headSha: pullRequest.headSha,
    });

    if (comments.length === 0) {
      this.logger.warn({
        message:
          'Skipping GitHub PR review comment posting: no resolvable comments',
        pullRequestId,
        repositoryName: repository.fullName,
        prNumber: pullRequest.prNumber,
        headSha: pullRequest.headSha,
        aiCommentCount: result.comments?.length ?? 0,
        changedFileCount: pullRequestFiles.length,
      });
      return;
    }

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
    pullRequestFiles: GithubPullRequestFileResponse[],
    context: ReviewCommentBuildContext,
  ): GithubPullRequestReviewComment[] {
    const resolvableLinesByPath =
      this.buildResolvableLinesByPath(pullRequestFiles);
    const skippedComments: AIReviewComment[] = [];

    const comments = (result.comments ?? [])
      .map((comment) => {
        const path = comment.filePath;
        const line = comment.endLine || comment.startLine;
        const body = comment.message?.trim();

        if (!path || !line || !body) {
          skippedComments.push(comment);
          return null;
        }

        const resolvableLines = resolvableLinesByPath.get(path);
        if (!resolvableLines?.has(line)) {
          skippedComments.push(comment);
          return null;
        }

        const githubComment: GithubPullRequestReviewComment = {
          path,
          line,
          side: 'RIGHT',
          body,
        };

        if (
          comment.startLine &&
          comment.startLine < line &&
          resolvableLines.has(comment.startLine)
        ) {
          githubComment.start_line = comment.startLine;
          githubComment.start_side = 'RIGHT';
        } else if (comment.startLine && comment.startLine < line) {
          this.logger.warn({
            message:
              'Posting GitHub review comment as single-line because startLine is not resolvable',
            ...context,
            comment,
          });
        }

        return githubComment;
      })
      .filter(
        (comment): comment is GithubPullRequestReviewComment =>
          comment !== null,
      );

    if (skippedComments.length > 0) {
      this.logger.warn({
        message: 'Skipped unresolved GitHub review comments',
        ...context,
        skippedCount: skippedComments.length,
        totalAiCommentCount: result.comments?.length ?? 0,
        postableCommentCount: comments.length,
        skippedComments,
      });
    }

    return comments;
  }

  private buildResolvableLinesByPath(
    pullRequestFiles: GithubPullRequestFileResponse[],
  ): Map<string, Set<number>> {
    const linesByPath = new Map<string, Set<number>>();

    for (const file of pullRequestFiles) {
      linesByPath.set(file.filename, this.parseResolvableRightSideLines(file));
    }

    return linesByPath;
  }

  private parseResolvableRightSideLines(
    file: GithubPullRequestFileResponse,
  ): Set<number> {
    const lineNumbers = new Set<number>();

    if (!file.patch) {
      return lineNumbers;
    }

    const patchLines = file.patch.split('\n');
    let newLineCursor = 0;
    const hunkHeaderRegex = /^@@\s+-(\d+),?(\d*)\s+\+(\d+),?(\d*)\s+@@/;

    for (const patchLine of patchLines) {
      const headerMatch = patchLine.match(hunkHeaderRegex);

      if (headerMatch) {
        newLineCursor = parseInt(headerMatch[3], 10);
        continue;
      }

      if (newLineCursor === 0) {
        continue;
      }

      if (patchLine.startsWith('-')) {
        continue;
      }

      lineNumbers.add(newLineCursor);
      newLineCursor++;
    }

    return lineNumbers;
  }

  private handleGithubError(
    error: unknown,
    repositoryName: string,
    prNumber: number,
  ): void {
    if (error instanceof AxiosError) {
      this.logger.error({
        repositoryName,
        prNumber,
        status: error.response?.status,
        message: JSON.stringify(error.response?.data),
      });

      if (error.response?.status === HttpStatus.UNPROCESSABLE_ENTITY) {
        this.logger.warn(
          `Skipping GitHub review comment posting for ${repositoryName}#${prNumber}: ${JSON.stringify(error.response.data)}`,
        );
        return;
      }

      throw new AppException(
        ExceptionCodes.GITHUB_API_ERROR,
        'Failed to post GitHub pull request review comments',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    throw error;
  }
}
