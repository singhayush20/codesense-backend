import { GithubRepoResponseDto } from "./github-repo-response.dto";

export class SyncReposResponseDto {
  total!: number;
  repositories!: GithubRepoResponseDto[];
}
