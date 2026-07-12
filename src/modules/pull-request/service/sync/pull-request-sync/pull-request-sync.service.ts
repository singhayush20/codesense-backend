import { Injectable } from '@nestjs/common';
import { GithubPrApiService } from '../../github/github-pr-api/github-pr-api.service';
import { PullRequestFileSyncService } from '../pull-request-file-sync/pull-request-file-sync.service';
import { DataSource, EntityManager } from 'typeorm';
import { GithubRepository } from '../../../../github-integration/entity/github-repo.entity';
import { PullRequest } from '../../../entity/pull-request.entity';
import { GithubPullRequestResponse } from '../../../dto/pull-request/github-pull-request-response.dto';
import { PullRequestMapper } from '../../../mapper/pull-request.mapper';
import { RepositoryFileContentSyncService } from '../repository-file-content-sync/repository-file-content-sync.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PullRequestSyncService {
  constructor(
    private readonly githubPrApiService: GithubPrApiService,
    private readonly pullRequestFileSyncService: PullRequestFileSyncService,
    private readonly dataSource: DataSource,
    private readonly repositoryFileContentSyncService: RepositoryFileContentSyncService,
    @InjectPinoLogger(PullRequestSyncService.name)
    private readonly logger: PinoLogger,
  ) {}

  async syncPullRequest(
    repository: GithubRepository,
    prNumber: number,
  ): Promise<PullRequest> {
    this.logger.debug(
      `Syncing PR for prNumber: ${prNumber}, repositoryId: ${repository.id}, installationId: ${repository.installation.installationId}`,
    );
    const [prResponse, fileResponses] = await Promise.all([
      this.githubPrApiService.fetchPullRequest(repository, prNumber),

      this.githubPrApiService.fetchPullRequestFiles(repository, prNumber),
    ]);

    // perform the operations in the same transaction using the manager
    const result = await this.dataSource.transaction(async (manager) => {
      const pullRequest = await this.upsertPullRequest(
        manager,
        repository,
        prResponse,
      );

      const savedFiles = await this.pullRequestFileSyncService.syncFiles(
        manager,
        pullRequest,
        fileResponses,
      );

      return {
        pullRequest,
        savedFiles,
      };
    });

    // perform outside the transaction because this needs file to be fetched from network
    await this.repositoryFileContentSyncService.syncSnapshots(
      repository,
      result.pullRequest,
      result.savedFiles,
    );

    return result.pullRequest;
  }

  private async upsertPullRequest(
    manager: EntityManager,
    repository: GithubRepository,
    response: GithubPullRequestResponse,
  ): Promise<PullRequest> {
    const mapped = PullRequestMapper.toEntity(repository, response);

    const existing = await manager.findOne(PullRequest, {
      where: {
        repository: {
          id: repository.id,
        },
        prNumber: response.number,
      },
    });

    if (existing) {
      manager.merge(PullRequest, existing, mapped);

      return manager.save(PullRequest, existing);
    }

    return manager.save(PullRequest, manager.create(PullRequest, mapped));
  }
}
