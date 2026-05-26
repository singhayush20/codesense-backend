import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorator/roles.decorator';
import { RoleTypes } from '../../../user/enums/role-types.enums';
import { CredentialService } from '../../service/credential.service';
import { LlmService } from '../../service/llm-call.service';
import * as currentUserDecorator from '../../../auth/decorator/current-user.decorator';
import { LlmResponse } from '../../../ai/dto/llm-response.dto';
import { LlmCallRequestDto } from '../../dtos/llm-call-request.dto';

@Controller('llm-calls')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class LlmCallsController {
  constructor(
    private readonly llmCredsService: CredentialService,
    private readonly llmCallService: LlmService,
  ) {}

  // TODO : Remove this endpoint, as it can expose the credentials
  @Get()
  @Roles(RoleTypes.ROLE_ADMIN)
  async getLlmResponse(
    @Query('providerId') providerId: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<Record<string, string>> {
    return await this.llmCredsService.getDecryptedConfig(
      providerId,
      user.userId,
    );
  }

  @Post('call')
  @Roles(RoleTypes.ROLE_ADMIN)
  async callLlm(@Body() llmRequest: LlmCallRequestDto): Promise<LlmResponse> {
    return await this.llmCallService.generate(
      llmRequest.providerType,
      llmRequest.request,
      llmRequest.context,
    );
  }
}
