import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { GithubInstallationService } from '../service/github-installation.service';
import { GithubRepoService } from '../service/github-repo.service';
import { GithubSelectionService } from '../service/github-selection.service';

import { SelectRepositoriesResponseDto } from '../dtos/select-repositories-response.dto';
import { SelectRepositoriesDto } from '../dtos/select-repositories.dto';
import { SelectedRepoResponseDto } from '../dtos/selected-repo-response.dto';
import { SyncReposDto } from '../dtos/sync-repos.dto';
import { HandleInstallationResponseDto } from '../dtos/handle-installation-response.dto';
import { GithubAccountResponseDto } from '../dtos/github-account-response.dto';
import { SyncReposResponseDto } from '../dtos/sync-repo-response.dto';
import { ConnectGithubResponseDto } from '../dtos/connect-response.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import { RoleTypes } from '../../user/enums/role-types.enums';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as currentUserDecorator from '../../auth/decorator/current-user.decorator';
import { UnselectedReposResponseDto } from '../dtos/unselect-repos-response.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('github')
@ApiBearerAuth('access-token')
export class GithubController {
  constructor(
    private readonly installationService: GithubInstallationService,
    private readonly repoService: GithubRepoService,
    private readonly selectionService: GithubSelectionService,
  ) {}

  @Get('connect')
  @Roles(RoleTypes.ROLE_USER)
  async getInstallUrl(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<ConnectGithubResponseDto> {
    return this.installationService.getConnectInfo(user.userId);
  }

  @Post('accounts/reconnect')
  @Roles(RoleTypes.ROLE_USER)
  async reconnect(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<{ success: boolean }> {
    await this.installationService.reconnectAccount(user.userId);
    return { success: true };
  }

  @Get('install/callback')
  @Roles(RoleTypes.ROLE_USER)
  async handleCallback(
    @Query('installation_id') installationId: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<HandleInstallationResponseDto> {
    return this.installationService.handleInstallation(user, installationId);
  }

  @Get('installations/sync')
  @Roles(RoleTypes.ROLE_USER)
  async syncGithubAppInstallation(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<{ success: boolean }> {
    await this.installationService.syncUserInstallations(user.userId);
    return { success: true };
  }

  @Get('accounts')
  @Roles(RoleTypes.ROLE_USER)
  async getAccounts(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<GithubAccountResponseDto[]> {
    return this.installationService.getUserAccounts(user.userId);
  }

  @Delete('accounts/unlink')
  @Roles(RoleTypes.ROLE_USER)
  async unlinkAccount(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
    @Body('accountId') accountId: string,
  ): Promise<{ success: boolean }> {
    await this.installationService.unlinkAccount(user, accountId);
    return { success: true };
  }

  @Post('repos/sync')
  @Roles(RoleTypes.ROLE_USER)
  async syncRepos(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
    @Body() dto: SyncReposDto,
  ): Promise<SyncReposResponseDto> {
    return this.repoService.syncRepositoriesByAccountId(user, dto.accountId);
  }

  @Post('repos/select')
  @Roles(RoleTypes.ROLE_USER)
  async selectRepos(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
    @Body() dto: SelectRepositoriesDto,
  ): Promise<SelectRepositoriesResponseDto> {
    return this.selectionService.selectRepositories(user, dto.repoIds);
  }

  @Patch('repos/unselect')
  @Roles(RoleTypes.ROLE_USER)
  async unselectRepos(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
    @Body() dto: SelectRepositoriesDto,
  ): Promise<UnselectedReposResponseDto> {
    return this.selectionService.unselectRepositories(user, dto.repoIds);
  }

  @Get('repos/selected')
  @Roles(RoleTypes.ROLE_USER)
  async getSelectedRepos(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<SelectedRepoResponseDto[]> {
    return this.selectionService.getUserSelections(user.userId);
  }
}
