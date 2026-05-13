import { PullRequest } from '../entity/pull-request.entity';

import { PullRequestFile } from '../entity/pull-request-file.entity';
import { PullRequestFileDto } from '../dto/query/pull-request-file.dto';
import { PullRequestListItemDto } from '../dto/query/pull-request-list-item.dto';
import { PullRequestDetailsDto } from '../dto/query/pull-request-details.dto';

export class PullRequestQueryMapper {
  static toListItemDto(entity: PullRequest): PullRequestListItemDto {
    return {
      id: entity.id,

      prNumber: entity.prNumber,

      title: entity.title,

      author: entity.author,

      state: entity.state,

      changedFiles: entity.changedFiles,

      additions: entity.additions,

      deletions: entity.deletions,

      createdAt: entity.createdAt,

      updatedAt: entity.updatedAt,
    };
  }

  static toDetailDto(entity: PullRequest): PullRequestDetailsDto {
    return {
      id: entity.id,

      prNumber: entity.prNumber,

      title: entity.title,

      author: entity.author,

      state: entity.state,

      baseBranch: entity.baseBranch,

      headBranch: entity.headBranch,

      headSha: entity.headSha,

      changedFiles: entity.changedFiles,

      additions: entity.additions,

      deletions: entity.deletions,

      commitCount: entity.commits,

      createdAt: entity.createdAt,

      updatedAt: entity.updatedAt,

      mergedAt: entity.mergedAt,
    };
  }

  static toFileDto(entity: PullRequestFile): PullRequestFileDto {
    return {
      id: entity.id,

      fileName: entity.fileName,

      status: entity.status,

      additions: entity.additions,

      deletions: entity.deletions,

      patch: entity.patch,
    };
  }
}
