export interface GithubCodeSearchResponse {
  total_count?: number;
  incomplete_results?: boolean;
  items?: GithubCodeSearchItem[];
}

export interface GithubCodeSearchItem {
  name?: string;
  path?: string;
  score?: number;
  sha?: string;
  repository?: {
    full_name?: string;
  };
}

export interface RepositorySearchResult {
  name?: string;
  filePath?: string;
  repository?: string;
  score?: number;
  sha?: string;
}

export interface AiToolContext {
  installationId: string;
  repositoryFullName: string;
  headSha: string;
  pullRequestNumber: number;
}

export interface GithubPullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

export type GithubPullRequestFilesResponse = GithubPullRequestFile[];

export interface PullRequestChangedFile {
  filePath: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}
