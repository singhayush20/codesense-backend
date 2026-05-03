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

    @InjectRepository(GithubAccount)
    private readonly userRepo: Repository<GithubAccount>,

    private readonly githubAuthService: GithubAppAuthService,
  ) {}

  // =========================
  // OAuth URL
  // =========================
  getGithubOAuthUrl(): string {
    return `https://github.com/login/oauth/authorize?...`;
  }

  // =========================
  // OAuth Callback
  // =========================
  async handleOAuthCallback(
    user: JwtUser,
    code: string,
  ): Promise<GithubAccount> {
    const githubUser = await this.fetchGithubUser(code);

    const userEntity = await this.userRepo.findOneOrFail({
      where: { id: user.userId },
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

  // =========================
  // Install URL
  // =========================
  getGithubInstallationUrl(accountId: string): string {
    return `https://github.com/apps/YOUR_APP/installations/new?target_id=${accountId}`;
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
        installationId, // already string (correct for bigint)
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
  // Sync Installations (CRITICAL)
  // =========================
  async syncInstallations(user: JwtUser): Promise<void> {
    const accounts = await this.accountRepo.find({
      where: {
        user: { userId: user.userId },
        isConnected: true,
      },
    });

    for (const account of accounts) {
      const installations = await this.getUserInstallations(
        account.githubAccountId,
      );

      for (const inst of installations) {
        await this.installationRepo.upsert(
          {
            installationId: inst.id.toString(),
            targetId: inst.account.id.toString(),
            account,
            isActive: true,
          },
          ['installationId'],
        );
      }
    }
  }

  private async getUserInstallations(
    accessToken: string,
  ): Promise<GithubUserInstallation[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<GithubUserInstallationsResponse>(
          'https://api.github.com/user/installations',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github+json',
            },
          },
        ),
      );

      return response.data.installations;
    } catch (error) {
      this.handleGithubError(error, 'Failed to fetch user installations');
    }
  }

  // =========================
  // Accounts
  // =========================
  async getUserAccounts(userId: string): Promise<GithubAccount[]> {
    return this.accountRepo.find({
      where: { user: { userId } },
    });
  }

  async unlinkAccount(user: JwtUser, accountId: string): Promise<void> {
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
      const jwt = this.githubAuthService.generateAppJwt(); // you already have this in token service

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

interface GithubUserResponse {
  id: number;
  login: string;
}

interface GithubInstallationResponse {
  id: number;
  account: {
    id: number;
    login: string;
  };
}
interface GithubUserInstallation {
  id: number;
  account: {
    id: number;
    login: string;
  };
}

interface GithubUserInstallationsResponse {
  total_count: number;
  installations: GithubUserInstallation[];
}