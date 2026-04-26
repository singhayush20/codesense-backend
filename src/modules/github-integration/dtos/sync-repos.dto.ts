import { IsString } from 'class-validator';

export class SyncReposDto {
  @IsString()
  accountId!: string;
}
