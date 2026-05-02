export interface GithubInstallationDeletedPayload {
  action: 'deleted';
  installation: {
    id: number;
  };
}
