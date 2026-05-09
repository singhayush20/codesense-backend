import { Injectable } from '@nestjs/common';
import { PrFileFilterService } from '../../validation/filter/pr-file-filter/pr-file-filter.service';
import { EntityManager } from 'typeorm';
import { PullRequest } from '../../../entity/pull-request.entity';
import { GithubPullRequestFileResponse } from '../../../dto/pull-request/GithubPullRequestFileResponse';
import { PullRequestFile } from '../../../entity/pull-request-file.entity';
import { PullRequestMapper } from '../../../mapper/pull-request.mapper';

@Injectable()
export class PullRequestFileSyncService {
  constructor(private readonly prFileFilterService: PrFileFilterService) {}

  async syncFiles(
    manager: EntityManager,
    pullRequest: PullRequest,
    files: GithubPullRequestFileResponse[],
  ): Promise<void> {
    await manager.delete(PullRequestFile, {
      pullRequest: {
        id: pullRequest.id,
      },
    });

    const filteredFiles = files.filter(
      (file) => !this.prFileFilterService.shouldIgnore(file.filename),
    );

    if(!filteredFiles.length) {
      return;
    }

    const entities = filteredFiles.map(
        (file) => manager.create(
            PullRequestFile,
            PullRequestMapper.fileToEntity(
                pullRequest,
                file,
            )
        )
    );

    await manager.save(PullRequestFile, entities);
  }
}
