import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LlmProviderService } from '../service/llm-provider.service';
import { CredentialService } from '../service/credential.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AddCredentialsDto } from '../dtos/add-credentials.dto';
import { CreateProviderDto } from '../dtos/create-provider.dto';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import { RoleTypes } from '../../user/enums/role-types.enums';
import { ProviderListResponseDto, ProviderResponseDto } from '../dtos/provider-response.dto';
import { SuccessResponseDto } from '../dtos/success-response.dto';
import * as currentUserDecorator from '../../auth/decorator/current-user.decorator';
import { ProviderMapper } from '../mapper/provider-model-to-dto.mapper';

@Controller('llm/providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class LlmProviderController {
  constructor(
    private readonly providerService: LlmProviderService,
    private readonly credentialService: CredentialService,
  ) {}

  @Post()
  @Roles(RoleTypes.ROLE_USER)
  @ApiOkResponse({ type: ProviderResponseDto })
  async create(
    @Body() dto: CreateProviderDto,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<ProviderResponseDto> {
    const provider = await this.providerService.create(user.userId, dto);

    return ProviderMapper.toDto(provider);
  }

  @Get()
  @Roles(RoleTypes.ROLE_USER)
  @ApiOkResponse({ type: [ProviderListResponseDto] })
  async getAll(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<ProviderListResponseDto[]> {
    const providerResponseDto = await this.providerService.getAll(user.userId);

    return providerResponseDto;
  }

  @Post(':id/credentials')
  @Roles(RoleTypes.ROLE_USER)
  @ApiOkResponse({ type: SuccessResponseDto })
  async addCredentials(
    @Param('id') id: string,
    @Body() dto: AddCredentialsDto,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<SuccessResponseDto> {
    await this.credentialService.addOrUpdateCredentials(
      id,
      user.userId,
      dto.config,
    );

    return { success: true };
  }

  @Delete(':id')
  @Roles(RoleTypes.ROLE_USER)
  @ApiOkResponse({ type: SuccessResponseDto })
  async delete(
    @Param('id') id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<SuccessResponseDto> {
    await this.providerService.delete(id, user.userId);

    return { success: true };
  }
}
