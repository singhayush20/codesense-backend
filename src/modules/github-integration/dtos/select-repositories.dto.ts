import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class SelectRepositoriesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  repoIds!: string[];
}
