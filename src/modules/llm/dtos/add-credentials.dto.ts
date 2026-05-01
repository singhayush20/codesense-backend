import { IsObject } from "class-validator";

export class AddCredentialsDto {
    @IsObject()
    config!: Record<string, any>; // different providers can have different config structure, so we keep it flexible with Record<string, any>
}