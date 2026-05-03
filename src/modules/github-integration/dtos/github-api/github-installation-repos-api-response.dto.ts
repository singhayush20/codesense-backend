export interface GithubRepoDto {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  permissions: Record<string, any>;
}

export interface GithubInstallationReposResponse {
  total_count: number;
  repositories: GithubRepoDto[];
}