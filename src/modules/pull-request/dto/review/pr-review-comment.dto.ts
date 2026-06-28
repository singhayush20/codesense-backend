import { ProviderType } from '../../../ai/enums/provider.type';

export interface GithubPullRequestReviewComment {
  path: string;
  line: number;
  side: 'RIGHT';
  body: string;
  start_line?: number;
  start_side?: 'RIGHT';
}

export interface GithubExistingReviewComment {
  id: number;
  path: string;
  line: number | null;
}

export interface ReviewResultsResponseDto {
  runId: string;

  provider: ProviderType;

  pullRequestId: string;

  reviewStatus: string;

  totalInputTokens?: number;

  totalOutputTokens?: number;

  totalTokens?: number;

  summary: string;

  comments: ReviewCommentResponseDto[];

  headSha?: string;

  baseSha?: string;
}

export interface ReviewCommentResponseDto {
  filePath: string;
  startLine: number;
  endLine: number;
  severity: string;
  category: string;
  message: string;
}
