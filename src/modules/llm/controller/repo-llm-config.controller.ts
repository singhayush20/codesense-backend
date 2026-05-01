import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RepoLlmConfigService } from '../service/repo-llm-config.service';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import * as currentUserDecorator from '../../auth/decorator/current-user.decorator';
import { Roles } from '../../auth/decorator/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RoleTypes } from '../../user/enums/role-types.enums';
import { RepoLlmConfigResponseDto } from '../dtos/repo-llm-config-response.dto';
import { SetRepoConfigDto } from '../dtos/set-repo-config.dto';
import { SuccessResponseDto } from '../dtos/success-response.dto';


@Controller('repos/:repoId/llm-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class RepoLlmConfigController {
  constructor(private readonly service: RepoLlmConfigService) {}

  @Post()
  @Roles(RoleTypes.ROLE_USER)
  @ApiOkResponse({ type: RepoLlmConfigResponseDto })
  async upsert(
    @Param('repoId') repoId: string,
    @Body() dto: SetRepoConfigDto,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<RepoLlmConfigResponseDto> {
    return this.service.upsert(user.userId, repoId, dto);
  }

  @Get()
  @Roles(RoleTypes.ROLE_USER)
  @ApiOkResponse({ type: RepoLlmConfigResponseDto })
  async get(
    @Param('repoId') repoId: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<RepoLlmConfigResponseDto> {
    return this.service.get(user.userId, repoId);
  }

  @Delete()
  @Roles(RoleTypes.ROLE_USER)
  @ApiOkResponse({ type: SuccessResponseDto })
  async delete(
    @Param('repoId') repoId: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<SuccessResponseDto> {
    await this.service.delete(user.userId, repoId);
    return { success: true };
  }
}
