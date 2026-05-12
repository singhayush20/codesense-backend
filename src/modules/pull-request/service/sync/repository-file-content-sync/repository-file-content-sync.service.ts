import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import pLimit from 'p-limit';

import { GithubPrFileContentService } from '../../github/github-pr-file-content/github-pr-file-content.service';

import { PrFileFilterService } from '../../validation/filter/pr-file-filter/pr-file-filter.service';

import { PullRequestFileSnapshot } from '../../../entity/pull-request-file-snapshot.entity';

import { GithubRepository } from '../../../../github-integration/entity/github-repo.entity';

import { PullRequest } from '../../../entity/pull-request.entity';

import { SnapshotExpiryUtil } from '../../../util/snapshot-expiry.util';

import { PullRequestFile } from '../../../entity/pull-request-file.entity';

import { PrFileState } from '../../../enums/pr-file-state.enum';

@Injectable()
export class RepositoryFileContentSyncService {
  private readonly logger = new Logger(RepositoryFileContentSyncService.name);

  private readonly CONCURRENCY = 5;

  private readonly MAX_FILES = 50;

  constructor(
    private readonly githubPrFileContentService: GithubPrFileContentService,

    private readonly prFileFilterService: PrFileFilterService,

    @InjectRepository(PullRequestFileSnapshot)
    private readonly snapshotRepository: Repository<PullRequestFileSnapshot>,
  ) {}

  async syncSnapshots(
    repository: GithubRepository,
    pullRequest: PullRequest,
    files: PullRequestFile[],
  ): Promise<void> {
    const filteredFiles = files
      .filter((file) => !this.prFileFilterService.shouldIgnore(file.fileName))
      .filter((file) => file.status !== PrFileState.REMOVED)
      .slice(0, this.MAX_FILES);

    if (!filteredFiles.length) {
      return;
    }

    const limit = pLimit(this.CONCURRENCY);

    const snapshotPromises = filteredFiles.map((file) =>
      limit(async () => {
        try {
          const content =
            await this.githubPrFileContentService.fetchFileContent(
              repository,
              file.fileName,
              pullRequest.headSha,
            );

          if (!content.trim()) {
            return null;
          }

          return this.snapshotRepository.create({
            pullRequestFile: file,

            content,

            sha: file.sha ?? '',

            expiresAt: SnapshotExpiryUtil.buildExpiryDate(),
          });
        } catch (error) {
          this.logger.warn({
            message: 'error when fetching file content, skipping snapshot',

            repository: repository.fullName,

            pullRequestId: pullRequest.id,

            fileName: file.fileName,
          });

          return null;
        }
      }),
    );

    const snapshots = await Promise.all(snapshotPromises);

    const validSnapshots = snapshots.filter(
      (snapshot): snapshot is PullRequestFileSnapshot => snapshot !== null,
    );

    if (!validSnapshots.length) {
      return;
    }

    await this.snapshotRepository.save(validSnapshots);

    this.logger.log({
      message: 'Pull request file snapshots synced',

      pullRequestId: pullRequest.id,

      snapshotCount: validSnapshots.length,
    });
  }
}
