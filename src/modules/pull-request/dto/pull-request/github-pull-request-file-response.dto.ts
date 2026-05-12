export interface GithubPullRequestFileResponse {
  sha?: string;

  filename: string;

  status: string;
  
  additions: number;

  deletions: number;

  patch?: string;
}