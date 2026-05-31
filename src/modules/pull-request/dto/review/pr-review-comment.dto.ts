export interface GithubPullRequestReviewComment {
  path: string;
  line: number;
  side: 'RIGHT';
  body: string;
  start_line?: number;
  start_side?: 'RIGHT';
}

export interface ReviewCommentInput {
  filePath?: string;
  path?: string;
  line?: number;
  lineNumber?: number;
  startLine?: number;
  endLine?: number;
  comment?: string;
  message?: string;
}
