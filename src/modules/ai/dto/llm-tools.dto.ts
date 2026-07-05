export interface GithubCodeSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GithubCodeSearchItem[];
}

export interface GithubCodeSearchItem {
  name: string;
  path: string;
  score: number;

  repository: {
    full_name: string;
  };

  text_matches?: GithubTextMatch[];
}

export interface GithubTextMatch {
  fragment: string;
}

export interface RepositorySearchResult {
  filePath: string;
  repository: string;
  score: number;
  snippet: string | null;
}
