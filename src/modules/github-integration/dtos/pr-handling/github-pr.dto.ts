export interface GithubPrFile {
  sha: string;
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface GithubIssueCommentResponse {
  id: number;
  body: string;
  html_url: string;
}

export interface GithubPullRequestEventPayload {
  installation: {
    id: number;
  };
  repository: {
    full_name: string;
  };
  pull_request: {
    number: number;
  };
}

export type GithubEventType = 'pull_request' | string;

export interface GithubWebhookHeaders {
  event: string;
  signature: string;
  deliveryId: string;
}

export interface GithubPullRequestPayload {
  action: string;
  installation: { id: number };
  repository: { full_name: string };
  pull_request: { number: number };
}