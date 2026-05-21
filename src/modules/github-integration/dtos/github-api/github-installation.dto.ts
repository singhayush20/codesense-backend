export interface GithubInstallationPayload {
  action: string;
  installation?: {
    id?: number;
  };
}
