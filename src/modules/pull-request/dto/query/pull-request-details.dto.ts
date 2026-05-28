export class PullRequestDetailsDto {
  id?: string;
  prNumber?: number;
  title?: string;
  body?: string;
  author?: string;
  state?: string;
  baseBranch?: string;
  headBranch?: string;
  headSha?: string;
  changedFiles?: number;
  additions?: number;
  deletions?: number;
  commitCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  mergedAt?: Date;
  isMerged?: boolean;
}
