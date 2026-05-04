import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { GithubInstallationService } from '../service/github-installation.service';
import { GithubRepoService } from '../service/github-repo.service';
import { GithubSelectionService } from '../service/github-selection.service';

import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import { RoleTypes } from '../../user/enums/role-types.enums';

import * as currentUserDecorator from '../../auth/decorator/current-user.decorator';
import { GithubAccountResponseDto } from '../dtos/github-account-response.dto';
import { HandleInstallationResponseDto } from '../dtos/handle-installation-response.dto';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { SyncReposResponseDto } from '../dtos/sync-repo-response.dto';
import { ConnectGithubResponseDto } from '../dtos/connect-response.dto';
import { SelectedRepoResponseDto } from '../dtos/selected-repo-response.dto';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('github')
@ApiBearerAuth('access-token')
export class GithubController {
  constructor(
    private readonly installationService: GithubInstallationService,
    private readonly repoService: GithubRepoService,
    private readonly selectionService: GithubSelectionService,
  ) {}

  // =========================
  // STEP 1: OAuth URL
  // =========================
  @Get('oauth/url')
  @Roles(RoleTypes.ROLE_USER)
  getOAuthUrl(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<ConnectGithubResponseDto> {
    return this.installationService.getGithubOAuthUrl(user.userId);
  }

  // =========================
  // STEP 2: OAuth Callback
  // =========================
  @Get('oauth/callback')
  @Roles(RoleTypes.ROLE_USER)
  async handleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<GithubAccountResponseDto> {
    return this.installationService.handleOAuthCallback(user, code, state);
  }

  // =========================
  // STEP 3: Install App URL
  // =========================
  @Get('install/url')
  @Roles(RoleTypes.ROLE_USER)
  async getInstallUrl(
    @Query('accountId') accountId: string,
    @CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<{ url: string }> {
    const url = await this.installationService.getGithubInstallationUrl(
      accountId,
      user,
    );
    return { url };
  }

  // =========================
  // STEP 4: Install Callback
  // =========================
  @Get('install/callback')
  @Roles(RoleTypes.ROLE_USER)
  async handleInstallCallback(
    @Query('installation_id') installationId: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<HandleInstallationResponseDto> {
    return this.installationService.handleInstallation(user, installationId);
  }

  // =========================
  // ACCOUNTS
  // =========================
  @Get('accounts')
  @Roles(RoleTypes.ROLE_USER)
  async getAccounts(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<GithubAccountResponseDto[]> {
    return this.installationService.getUserAccounts(user.userId);
  }

  // =========================
  // REPO SYNC
  // =========================
  @Post('repos/sync')
  @Roles(RoleTypes.ROLE_USER)
  async syncRepos(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
    @Body() dto: { installationId: string },
  ): Promise<SyncReposResponseDto> {
    return this.repoService.syncRepositoriesByInstallationId(
      user,
      dto.installationId,
    );
  }

  // =========================
  // REPO SELECTION
  // =========================
  @Post('repos/select')
  @Roles(RoleTypes.ROLE_USER)
  async selectRepos(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
    @Body() dto: { installationId: string; repoIds: string[] },
  ) {
    return this.selectionService.selectRepositories(
      user,
      dto.installationId,
      dto.repoIds,
    );
  }

  @Patch('repos/unselect')
  @Roles(RoleTypes.ROLE_USER)
  async unselectRepos(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
    @Body() dto: { installationId: string; repoIds: string[] },
  ) {
    return this.selectionService.unselectRepositories(
      user,
      dto.installationId,
      dto.repoIds,
    );
  }

  @Get('repos/selected')
  @Roles(RoleTypes.ROLE_USER)
  async getSelectedRepos(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<SelectedRepoResponseDto[]> {
    return this.selectionService.getUserSelections(user.userId);
  }

  @Post('accounts/signout')
  @Roles(RoleTypes.ROLE_USER)
  async signout(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
    @Body('accountId') accountId: string,
  ): Promise<{ success: boolean }> {
    await this.installationService.signout(user, accountId);
    return { success: true };
  }
}
