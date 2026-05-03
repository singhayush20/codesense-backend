export interface GithubAccountResponseDto {
  id: string;
  githubAccountId: string;
  loginId: string;
  accountType: string;
  isConnected: boolean;
  createdAt: Date;
}
