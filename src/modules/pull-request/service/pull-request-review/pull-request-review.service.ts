import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PullRequestReviewJob } from '../../entity/pull-request-review-job.entity';
import { PullRequest } from '../../entity/pull-request.entity';
import { PullRequestReviewJobResult } from '../../entity/pull-request-review-job-result.entity';

import { ProviderType } from '../../../ai/enums/provider.type';
import { LlmResponseDto } from '../../../ai/dto/llm-response.dto';
import { PullRequestReviewStatus } from '../../enums/pull-request-review-status.enum';

@Injectable()
export class PullRequestReviewService {
  private readonly logger = new Logger(PullRequestReviewService.name);

  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(PullRequestReviewJob)
    private readonly pullRequestReviewRepository: Repository<PullRequestReviewJob>,

    @InjectRepository(PullRequest)
    private readonly pullRequestRepository: Repository<PullRequest>,

    @InjectRepository(PullRequestReviewJobResult)
    private readonly pullRequestReviewResultRepository: Repository<PullRequestReviewJobResult>,
  ) {}

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
      const pullRequest = await manager.findOne(PullRequest, {
        where: {
          id: pullRequestId,
        },
      });

      if (!pullRequest) {
        throw new NotFoundException(`Pull request not found: ${pullRequestId}`);
      }

      const reviewJob = manager.create(PullRequestReviewJob, {
        runId,
        pullRequest,
        providerType: provider,
        status: PullRequestReviewStatus.SUCCESS,
      });

      const savedReviewJob = await manager.save(
        PullRequestReviewJob,
        reviewJob,
      );

      const reviewResult = manager.create(PullRequestReviewJobResult, {
        job: savedReviewJob,
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

      savedReviewJob.result = savedReviewResult;

      return savedReviewJob;
    });
  }
}
