import { GithubRepository } from '../../github-integration/entity/github-repo.entity';
import { getPrStateFromString } from '../enums/pr-state.enum';
import { GithubPullRequestResponse } from '../dto/pull-request/github-pull-request-response.dto';
import { PullRequest } from '../entity/pull-request.entity';
import { GithubPullRequestFileResponse } from '../dto/pull-request/github-pull-request-file-response.dto';
import { PullRequestFile } from '../entity/pull-request-file.entity';
import { getPrFileStateFromString } from '../enums/pr-file-state.enum';

export class PullRequestMapper {
  static toEntity(
    repository: GithubRepository,
    pr: GithubPullRequestResponse,
  ): Partial<PullRequest> {
    return {
      repository,
      prNumber: pr.number,
      title: pr.title,
      author: pr.user.login,
      state: getPrStateFromString(pr.state),
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      isMerged: Boolean(pr.merged_at),
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(pr.updated_at),
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
      lastSynced: new Date(),
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      commits: pr.commits,
      body: pr.body,
      headSha: pr.head.sha,
    };
  }

  static fileToEntity(
    pullRequest: PullRequest,
    file: GithubPullRequestFileResponse,
  ): Partial<PullRequestFile> {
    return {
      pullRequest,

      fileName: file.filename,

      patch: file.patch ?? '',

      status: getPrFileStateFromString(file.status),

      additions: file.additions,

      deletions: file.deletions,

      sha: file.sha,
    };
  }
}
