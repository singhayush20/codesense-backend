export class GithubRepoResponseDto {
  id!: string;
  repoId!: string;
  name!: string;
  fullName!: string;
  isPrivate!: boolean;
  permissions!: Record<string, any>;
}
