import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GithubAccount } from '../entity/github-account.entity';
import { GithubInstallation } from '../entity/github-installation.entity';
import { JwtUser } from '../../auth/decorator/current-user.decorator';

import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { GithubAccountType } from '../enums/github-account-types.enum';
import { HandleInstallationResponseDto } from '../dtos/handle-installation-response.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { GithubAppAuthService } from './github-app-auth.service';
import { CacheService } from '../../../cache/cache.service';
import { User } from '../../user/entity/user.entity';
import { ConnectGithubResponseDto } from '../dtos/connect-response.dto';
import {
  GithubUserResponse,
} from '../dtos/github-auth.dto';
import { GithubInstallationResponse } from '../dtos/github-installation-response.dto';

@Injectable()
export class GithubInstallationService {
  private readonly logger = new Logger(GithubInstallationService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,

    @InjectRepository(GithubAccount)
    private readonly accountRepo: Repository<GithubAccount>,

    @InjectRepository(GithubInstallation)
    private readonly installationRepo: Repository<GithubInstallation>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly githubAuthService: GithubAppAuthService,
    private readonly cacheService: CacheService,
  ) {}

  // =========================
  // OAuth URL
  // =========================
  async getGithubOAuthUrl(userId: string): Promise<ConnectGithubResponseDto> {
    const state = crypto.randomUUID();

    const cacheKey = `gh:oauth:state:${state}`;

    await this.cacheService.set(cacheKey, userId, 300);

    const params = new URLSearchParams({
      client_id: this.config.get('github.clientId')!,
      redirect_uri: this.config.get('github.oauthRedirectUri')!,
      scope: 'read:user user:email',
      state,
    });

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    };
  }

  // =========================
  // OAuth Callback
  // =========================
  async handleOAuthCallback(
    user: JwtUser,
    code: string,
    state: string,
  ): Promise<GithubAccount> {
    await this.validateState(state, user.userId);

    const githubUser = await this.fetchGithubUser(code);

    const userEntity = await this.userRepo.findOneOrFail({
      where: { userId: user.userId },
    });

    let account = await this.accountRepo.findOne({
      where: {
        user: { userId: user.userId },
        githubAccountId: githubUser.id.toString(),
      },
    });

    if (!account) {
      account = this.accountRepo.create({
        user: userEntity,
        githubAccountId: githubUser.id.toString(),
        loginId: githubUser.login,
        accountType: GithubAccountType.USER,
        isConnected: true,
      });
    } else {
      account.isConnected = true;
    }

    return this.accountRepo.save(account);
  }

  private async validateState(state: string, userId: string): Promise<void> {
    const cacheKey = `gh:oauth:state:${state}`;

    const storedUserId = await this.cacheService.get<string>(cacheKey);

    if (!storedUserId) {
      throw new AppException(
        ExceptionCodes.INVALID_OAUTH_STATE,
        'OAuth state expired or invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (storedUserId !== userId) {
      throw new AppException(
        ExceptionCodes.INVALID_OAUTH_STATE,
        'OAuth state mismatch',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // delete after use (one-time)
    await this.cacheService.delete(cacheKey);
  }

  // =========================
  // Install URL
  // =========================
  async getGithubInstallationUrl(
    accountId: string,
    user: JwtUser,
  ): Promise<string> {
    const account = await this.accountRepo.findOne({
      where: {
        user: { userId: user.userId },
        isConnected: true,
      },
      relations: ['installations'],
    });

    if (!account) {
      throw new AppException(
        ExceptionCodes.GITHUB_ACCOUNT_NOT_FOUND,
        'GitHub account not found or not connected',
        HttpStatus.NOT_FOUND,
      );
    }

    const installation = account.installation;

    if (installation) {
      await this.installationRepo.update(
        { account: { id: accountId } },
        { isActive: true },
      );
      return `https://github.com/settings/installations/${installation.installationId}`;
    } else {
      return `https://github.com/apps/codesense-platform/installations/new/permissions?target_id=${accountId}`;
    }
  }

  // =========================
  // Install Callback
  // =========================
  async handleInstallation(
    user: JwtUser,
    installationId: string,
  ): Promise<HandleInstallationResponseDto> {
    const installationData = await this.getInstallation(installationId);

    if (!installationData?.account?.id) {
      throw new AppException(
        ExceptionCodes.GITHUB_INVALID_RESPONSE,
        'Invalid installation data from GitHub',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const githubAccountId = installationData.account.id.toString();

    const account = await this.accountRepo.findOne({
      where: {
        user: { userId: user.userId },
        githubAccountId,
      },
    });

    if (!account) {
      throw new AppException(
        ExceptionCodes.GITHUB_ACCOUNT_NOT_FOUND,
        'Account not linked',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.installationRepo.upsert(
      {
        installationId,
        targetId: githubAccountId,
        account,
        isActive: true,
      },
      ['installationId'],
    );

    return {
      success: true,
      installationId,
      accountId: account.id,
    };
  }

  // =========================
  // Accounts
  // =========================
  async getUserAccounts(userId: string): Promise<GithubAccount[]> {
    return this.accountRepo.find({
      where: { user: { userId } },
    });
  }

  async signout(user: JwtUser, accountId: string): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: {
        id: accountId,
        user: { userId: user.userId },
      },
    });

    if (!account) {
      throw new AppException(
        ExceptionCodes.GITHUB_ACCOUNT_NOT_FOUND,
        'Account not found',
        HttpStatus.NOT_FOUND,
      );
    }

    account.isConnected = false;
    await this.accountRepo.save(account);

    await this.installationRepo.update(
      { account: { id: accountId } },
      { isActive: false },
    );
  }

  private async fetchGithubUser(code: string): Promise<GithubUserResponse> {
    try {
      // Step 1: Exchange code for access token
      const tokenResponse = await firstValueFrom(
        this.http.post(
          'https://github.com/login/oauth/access_token',
          {
            client_id: this.config.get<string>('GITHUB_CLIENT_ID'),
            client_secret: this.config.get<string>('GITHUB_CLIENT_SECRET'),
            code,
          },
          {
            headers: {
              Accept: 'application/json',
            },
          },
        ),
      );

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        throw new AppException(
          ExceptionCodes.GITHUB_AUTH_FAILED,
          'Failed to retrieve access token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Step 2: Fetch user info
      const userResponse = await firstValueFrom(
        this.http.get<GithubUserResponse>('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
          },
        }),
      );

      return userResponse.data;
    } catch (error) {
      this.handleGithubError(error, 'OAuth user fetch failed');
    }
  }

  private async getInstallation(
    installationId: string,
  ): Promise<GithubInstallationResponse> {
    try {
      const jwt = this.githubAuthService.generateAppJwt();

      const response = await firstValueFrom(
        this.http.get<GithubInstallationResponse>(
          `https://api.github.com/app/installations/${installationId}`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
              Accept: 'application/vnd.github+json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleGithubError(
        error,
        `Failed to fetch installation ${installationId}`,
      );
    }
  }

  private handleGithubError(error: unknown, context: string): never {
    if (error instanceof AxiosError) {
      this.logger.error(
        `${context} | ${error.response?.status} - ${JSON.stringify(error.response?.data)}`,
      );

      throw new AppException(
        ExceptionCodes.GITHUB_API_ERROR,
        context,
        error.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.error(`${context} | Unknown error`, error as any);

    throw new AppException(
      ExceptionCodes.GITHUB_API_ERROR,
      context,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
