import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class SetRepoConfigDto {
    @IsUUID()
    providerId!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    model!: string;
}