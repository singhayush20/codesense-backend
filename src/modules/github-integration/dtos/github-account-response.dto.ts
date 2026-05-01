import type     { GithubAccountType } from '../enums/github-account-types.enum';

export class GithubAccountResponseDto {
  id!: string;
  login!: string;
  githubAccountId!: string;
  installationId!: string;
  accountType!: GithubAccountType;
  createdAt!: Date;
}
