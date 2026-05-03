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
import { GithubRepoService, SyncReposResponse } from '../service/github-repo.service';
import { GithubSelectionService, SelectedRepoDto } from '../service/github-selection.service';

import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import { RoleTypes } from '../../user/enums/role-types.enums';

import * as currentUserDecorator from '../../auth/decorator/current-user.decorator';
import * as currentUserDecorator_1 from '../../auth/decorator/current-user.decorator';
import { GithubAccountResponseDto } from '../dtos/github-account-response.dto';
import { HandleInstallationResponseDto } from '../dtos/handle-installation-response.dto';


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
  getOAuthUrl(): { url: string } {
    return {
      url: this.installationService.getGithubOAuthUrl(),
    };
  }

  // =========================
  // STEP 2: OAuth Callback
  // =========================
  @Get('oauth/callback')
  @Roles(RoleTypes.ROLE_USER)
  async handleOAuthCallback(
    @Query('code') code: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator_1.JwtUser,
  ): Promise<GithubAccountResponseDto> {
    return this.installationService.handleOAuthCallback(user, code);
  }

  // =========================
  // STEP 3: Install App URL
  // =========================
  @Get('install/url')
  @Roles(RoleTypes.ROLE_USER)
  getInstallUrl(@Query('accountId') accountId: string): { url: string } {
    return {
      url: this.installationService.getGithubInstallationUrl(accountId),
    };
  }

  // =========================
  // STEP 4: Install Callback
  // =========================
  @Get('install/callback')
  @Roles(RoleTypes.ROLE_USER)
  async handleInstallCallback(
    @Query('installation_id') installationId: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator_1.JwtUser,
  ): Promise<HandleInstallationResponseDto> {
    return this.installationService.handleInstallation(user, installationId);
  }

  // =========================
  // STEP 5: Sync Installations
  // =========================
  @Post('installations/sync')
  @Roles(RoleTypes.ROLE_USER)
  async syncInstallations(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator_1.JwtUser,
  ): Promise<{ success: boolean }> {
    await this.installationService.syncInstallations(user);
    return { success: true };
  }

  // =========================
  // ACCOUNTS
  // =========================
  @Get('accounts')
  @Roles(RoleTypes.ROLE_USER)
  async getAccounts(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator_1.JwtUser,
  ): Promise<GithubAccountResponseDto[]> {
    return this.installationService.getUserAccounts(user.userId);
  }

  @Post('accounts/unlink')
  @Roles(RoleTypes.ROLE_USER)
  async unlinkAccount(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator_1.JwtUser,
    @Body('accountId') accountId: string,
  ): Promise<{ success: boolean }> {
    await this.installationService.unlinkAccount(user, accountId);
    return { success: true };
  }

  // =========================
  // REPO SYNC
  // =========================
  @Post('repos/sync')
  @Roles(RoleTypes.ROLE_USER)
  async syncRepos(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator_1.JwtUser,
    @Body() dto: { installationId: string },
  ): Promise<SyncReposResponse> {
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
    @currentUserDecorator.CurrentUser() user: currentUserDecorator_1.JwtUser,
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
    @currentUserDecorator.CurrentUser() user: currentUserDecorator_1.JwtUser,
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
    @currentUserDecorator.CurrentUser() user: currentUserDecorator_1.JwtUser,
  ): Promise<SelectedRepoDto[]> {
    return this.selectionService.getUserSelections(user.userId);
  }
}
