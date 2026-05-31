export interface GithubPullRequestReviewComment {
  path: string;
  line: number;
  side: 'RIGHT';
  body: string;
  start_line?: number;
  start_side?: 'RIGHT';
}
