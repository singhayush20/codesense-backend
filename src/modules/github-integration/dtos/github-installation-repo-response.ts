export interface GithubInstallationReposResponse {
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    permissions: Record<string, any>;
  }>;
}
