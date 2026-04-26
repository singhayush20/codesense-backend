import { GithubAccountType } from "../enums/github-account-types.enum";

export interface GithubInstallationResponse {
  account: {
    id: number;
    login: string;
    type: GithubAccountType;
  };
}
