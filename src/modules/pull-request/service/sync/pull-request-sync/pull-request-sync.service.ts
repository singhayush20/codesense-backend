import { Injectable } from '@nestjs/common';
import { GithubPrApiService } from '../../github/github-pr-api/github-pr-api.service';
import { PullRequestFileSyncService } from '../pull-request-file-sync/pull-request-file-sync.service';
import { DataSource, EntityManager } from 'typeorm';
import { GithubRepository } from '../../../../github-integration/entity/github-repo.entity';
import { PullRequest } from '../../../entity/pull-request.entity';
import { GithubPullRequestResponse } from '../../../dto/pull-request/GithubPullRequestResponse';
import { PullRequestMapper } from '../../../mapper/pull-request.mapper';

@Injectable()
export class PullRequestSyncService {
  constructor(
    private readonly githubPrApiService: GithubPrApiService,
    private readonly pullRequestFileSyncService: PullRequestFileSyncService,
    private readonly dataSource: DataSource,
  ) {}

  async syncPullRequest(
    repository: GithubRepository,
    prNumber: number,
  ): Promise<PullRequest> {
    const [prResponse, fileResponses] = await Promise.all([
      this.githubPrApiService.fetchPullRequest(repository, prNumber),

      this.githubPrApiService.fetchPullRequestFiles(repository, prNumber),
    ]);

    return this.dataSource.transaction(async (manager) => {
      const pullRequest = await this.upsertPullRequest(
        manager,
        repository,
        prResponse,
      );

      await this.pullRequestFileSyncService.syncFiles(
        manager,
        pullRequest,
        fileResponses,
      );

      return pullRequest;
    });
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
