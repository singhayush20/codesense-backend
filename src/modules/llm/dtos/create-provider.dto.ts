import { IsEnum, IsString, MaxLength } from 'class-validator';
import { ProviderType } from '../../ai/enums/provider.type';

export class CreateProviderDto {
  @IsEnum(ProviderType)
  providerType!: ProviderType;

  @IsString()
  @MaxLength(100)
  displayName!: string;
}
