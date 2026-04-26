import { SelectedRepoResponseDto } from "./selected-repo-response.dto";

export class SelectRepositoriesResponseDto {
  count!: number;
  repositories!: SelectedRepoResponseDto[];
}
