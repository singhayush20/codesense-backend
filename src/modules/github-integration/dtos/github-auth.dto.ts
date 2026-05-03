export interface GithubUserResponse {
  id: number;
  login: string;
}

export interface GithubInstallationResponse {
  id: number;
  account: {
    id: number;
    login: string;
  };
}