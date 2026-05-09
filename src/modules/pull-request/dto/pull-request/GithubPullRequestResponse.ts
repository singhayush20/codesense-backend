export interface GithubPullRequestResponse {
  id: number;

  number: number;

  title: string;

  state: 'open' | 'closed';

  merged_at: string | null;

  created_at: string;

  updated_at: string;

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
