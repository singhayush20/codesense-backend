import { Injectable } from '@nestjs/common';
import { PullRequestLockService } from '../../sync/pull-request-lock/pull-request-lock.service';
import { PullRequestSyncService } from '../../sync/pull-request-sync/pull-request-sync.service';
import { PrValidationService } from '../../validation/pr-validation/pr-validation.service';
import { GithubRepoService } from '../../../../github-integration/service/github-repo.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GithubPullRequestEventPayload } from '../../../../github-integration/dtos/pr-handling/github-pr.dto';
import { PrAnalyzerDto } from '../../../dto/queue-payload/pr-analyzer-payload.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrWorkflowService {
  constructor(
    private readonly pullRequestLockService: PullRequestLockService,
    private readonly pullRequestSyncService: PullRequestSyncService,
    private readonly githubRepositoryService: GithubRepoService,
    private readonly prValidationService: PrValidationService,
    @InjectQueue('code-review')
    private readonly aiReviewQueue: Queue,
    @InjectPinoLogger(PrWorkflowService.name)
    private readonly logger: PinoLogger,
  ) {}

  async processPullRequest(job: GithubPullRequestEventPayload): Promise<void> {
    const installationId = job.installation.id.toString();
    const repositoryId = job.repository.id.toString();
    const prNumber = job.pull_request.number;
    const prHeadSha = job.pull_request.head.sha;
    const prBaseSha = job.pull_request.base.sha;

    this.logger.debug(
      `Processing PR for prNumber: ${prNumber}, repositoryId: ${repositoryId}, installationId: ${installationId}, headSha: ${prHeadSha}, baseSha: ${prBaseSha}`,
    );

    const lockKey = this.pullRequestLockService.buildLockKey(
      repositoryId,
      prNumber,
    );

    const isLockAcquired =
      await this.pullRequestLockService.acquireLock(lockKey);

    if (!isLockAcquired) {
      this.logger.warn({
        message: 'PR sync already running',
        repositoryId,
        prNumber,
      });
    }

    try {
      await this.prValidationService.validatePullRequestRepoSelection(
        installationId,
        repositoryId,
      );

      const repository =
        await this.githubRepositoryService.getRepositoryByGithubRepoId(
          repositoryId,
        );

      if (!repository) {
        this.logger.error(
          `Repository with github id ${repositoryId} not found in database`,
        );
        return;
      }

      const pullRequest = await this.pullRequestSyncService.syncPullRequest(
        repository,
        prNumber,
      );

      if (!pullRequest) {
        this.logger.error(
          `Pull request with number ${prNumber} not found in database`,
        );
        return;
      }
      this.logger.info({
        message: 'PR sync completed',
        pullRequestId: pullRequest.id,
        repositoryId,
        prNumber,
      });

      await this.enqueueAiReview(
        pullRequest.id,
        pullRequest.state,
        job.repository.id,
        prHeadSha,
        prBaseSha,
      );
    } catch (e) {
      this.logger.error(
        { err: e },
        `Error processing PR workflow for repository ${repositoryId} and PR number ${prNumber}`,
      );
    } finally {
      await this.pullRequestLockService.releaseLock(lockKey);
    }
  }

  private async enqueueAiReview(
    pullRequestId: string,
    state: string,
    repositoryId: number,
    headSha: string,
    baseSha: string,
  ): Promise<void> {
    // TODO: enque ai review based on the pr state - check for the possible states
    if (state !== 'open') {
      this.logger.info(`PR state is ${state}, skipping ai review`);
      return;
    }
    const payload: PrAnalyzerDto = {
      pullRequestId,
      repositoryId,
      headSha,
      baseSha,
    };

    try {
      this.logger.debug(
        `Enqueuing AI review for pullRequestId: ${pullRequestId}, repositoryId: ${repositoryId}, headSha: ${headSha}, baseSha: ${baseSha}`,
      );

      await this.aiReviewQueue.add(
        `pr-analysis:${pullRequestId}:${Date.now()}`,
        payload,
        {
          jobId: `ai-review-${pullRequestId}-${Date.now()}`,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 3000, // base delay is 3 seconds, therefore retries will happen at 3s, 6s, 12s, 24s, etc.
          },
          removeOnComplete: 1000, // keep successful jobs for upto 1000 entries, then start removing old ones
          removeOnFail: 5000, // keep failed jobs for upto 5000 entries for debugging purposes, then start removing old ones
        },
      );
    } catch (e) {
      this.logger.error(
        { err: e },
        `Failed to enqueue AI review for pullRequestId: ${pullRequestId}, repositoryId: ${repositoryId}`,
      );
    }
  }
}
