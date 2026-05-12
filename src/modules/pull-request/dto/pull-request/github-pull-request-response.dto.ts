export interface GithubPullRequestResponse {
  id: number;

  number: number;

  title: string;

  state: 'open' | 'closed' | 'merged';

  merged_at: string | null;

  created_at: string;

  updated_at: string;

  additions: number;

  deletions: number;

  changed_files: number;

  commits: number;

  body: string | null;

  user: {
    login: string;
  };

  base: {
    ref: string;
  };

  head: {
    ref: string;
    sha: string;
  };
}
