import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { PullRequestReviewJob } from '../../entity/pull-request-review-job.entity';
import { PullRequest } from '../../entity/pull-request.entity';
import { PullRequestReviewJobResult } from '../../entity/pull-request-review-job-result.entity';

import { ProviderType } from '../../../ai/enums/provider.type';
import { LlmResponseDto } from '../../../ai/dto/llm-response.dto';
import { PullRequestReviewStatus } from '../../enums/pull-request-review-status.enum';

@Injectable()
export class PullRequestReviewService {
  /**
   * The service uses DataSource directly because these operations require
   * explicit transaction management for atomic review job state updates.
   *
   * Using a Transactional EntityManager here ensures that superseding
   * existing in-progress jobs and creating the new job happen together.
   */
  constructor(
    private readonly dataSource: DataSource,
    @InjectPinoLogger(PullRequestReviewService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Persist a completed review result only if the review job is still active.
   * Old or cancelled review jobs must not overwrite the current PR review state.
   */
  async savePullRequestReview(
    runId: string,
    pullRequestId: string,
    provider: ProviderType,
    result: LlmResponseDto,
    repositoryId: string,
  ): Promise<PullRequestReviewJob> {
    this.logger.debug(
      `Saving pull request review. runId=${runId}, pullRequestId=${pullRequestId}, provider=${provider}, repositoryId=${repositoryId}`,
    );

    return this.dataSource.transaction(async (manager) => {
      let existingReviewJob = await manager.findOne(PullRequestReviewJob, {
        where: {
          runId,
        },
        relations: ['result'],
      });

      if (!existingReviewJob) {
        const pullRequest = await manager.findOne(PullRequest, {
          where: {
            id: pullRequestId,
          },
        });

        if (!pullRequest) {
          throw new NotFoundException(
            `Pull request not found: ${pullRequestId}`,
          );
        }

        // TODO: Remove this as this might not be needed.
        existingReviewJob = await manager.save(
          PullRequestReviewJob,
          manager.create(PullRequestReviewJob, {
            runId,
            pullRequest,
            providerType: provider,
            status: PullRequestReviewStatus.IN_PROGRESS,
          }),
        );
      }

      if (existingReviewJob.result) {
        this.logger.debug(
          `Pull request review already saved. runId=${runId}, reviewJobId=${existingReviewJob.id}`,
        );
        return existingReviewJob;
      }

      if (
        existingReviewJob.status === PullRequestReviewStatus.SUPERSEDED ||
        existingReviewJob.status === PullRequestReviewStatus.CANCELLED ||
        existingReviewJob.status === PullRequestReviewStatus.FAILED
      ) {
        this.logger.debug(
          `Skipping save for non-active review job. runId=${runId}, status=${existingReviewJob.status}`,
        );
        return existingReviewJob;
      }

      const reviewResult = manager.create(PullRequestReviewJobResult, {
        id: existingReviewJob.id,
        job: existingReviewJob,
        totalInputTokens: result.totalInputTokens ?? 0,
        totalOutputTokens: result.totalOutputTokens ?? 0,
        totalTokens: result.totalTokenUsage ?? 0,
        comments: result.comments ?? [],
        summary: result.consolidatedSummary ?? '',
      });

      const savedReviewResult = await manager.save(
        PullRequestReviewJobResult,
        reviewResult,
      );

      existingReviewJob.result = savedReviewResult;

      return existingReviewJob;
    });
  }
}
