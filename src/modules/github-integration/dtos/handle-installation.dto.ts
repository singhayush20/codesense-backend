import { IsString } from 'class-validator';

export class HandleInstallationDto {
  @IsString()
  installationId!: string;
}
