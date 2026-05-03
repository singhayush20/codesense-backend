import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GithubAccount } from '../entity/github-account.entity';
import { In, Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GithubAccountResponseDto } from '../dtos/github-account-response.dto';
import { HandleInstallationResponseDto } from '../dtos/handle-installation-response.dto';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { JwtUser } from '../../auth/decorator/current-user.decorator';
import { UserService } from '../../user/service/user.service';
import { GithubAppAuthService } from './github-app-auth.service';
import {
  GithubAccountType,
  mapGithubAccountType,
} from '../enums/github-account-types.enum';
import { GithubRepository } from '../entity/github-repo.entity';
import { UserRepositorySelection } from '../entity/user-repo-selection.entity';
import { GithubAccountStatus } from '../enums/github-account-status.enum';
import { ConnectGithubResponseDto } from '../dtos/connect-response.dto';

@Injectable()
export class GithubInstallationService {
  private readonly logger = new Logger(GithubInstallationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(GithubAccount)
    private githubAccountRepository: Repository<GithubAccount>,
    private userService: UserService,
    private http: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: GithubAppAuthService,
  ) {}

  async getConnectInfo(userId: string): Promise<ConnectGithubResponseDto> {
    const existing = await this.githubAccountRepository.findOne({
      where: {
        user: { userId },
        status: GithubAccountStatus.DISCONNECTED,
      },
    });

    if (existing) {
      return {
        reconnect: true,
      };
    }

    return {
      reconnect: false,
      url: this.getGithubInstallationUrl(),
    };
  }

  getGithubInstallationUrl(): string {
    const githubAppName = this.configService.get<string>('github.appName');

    if (githubAppName)
      return `https://github.com/apps/${githubAppName}/installations/new`;
    else
      throw new AppException(
        ExceptionCodes.GITHUB_APP_NAME_NOT_CONFIGURED,
        'GitHub App name is not properly configured.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }

  async handleInstallation(
    user: JwtUser,
    installationId: string,
  ): Promise<HandleInstallationResponseDto> {
    const exists = await this.githubAccountRepository.findOne({
      where: { installationId },
    });

    if (exists) {
      exists.status = GithubAccountStatus.ACTIVE;
      exists.disconnectedAt = null;
      const account = await this.githubAccountRepository.save(exists);

      return {
        success: true,
        account: {
          id: account.id,
          login: account.loginId,
          installationId: account.installationId,
        },
      };
    }

    const installation = await this.fetchInstallationDetails(installationId);

    const account = await this.githubAccountRepository.save({
      user: { userId: user.userId },
      installationId,
      githubAccountId: installation.account.id.toString(),
      loginId: installation.account.login,
      accountType:
        installation.account.type === 'User'
          ? GithubAccountType.USER
          : GithubAccountType.ORGANIZATION,
      status: GithubAccountStatus.ACTIVE,
    });

    return {
      success: true,
      account: {
        id: account.id,
        login: account.loginId,
        installationId: account.installationId,
      },
    };
  }

  async reconnectAccount(userId: string): Promise<void> {
    const accounts = await this.githubAccountRepository.find({
      where: {
        user: { userId },
        status: GithubAccountStatus.DISCONNECTED,
      },
    });

    for (const acc of accounts) {
      const exists = await this.checkInstallationExists(acc.installationId);

      if (!exists) continue;

      acc.status = GithubAccountStatus.ACTIVE;
      acc.disconnectedAt = null;

      await this.githubAccountRepository.save(acc);
    }
  }

  async syncUserInstallations(userId: string): Promise<void> {
    const accounts = await this.githubAccountRepository.find({
      where: { user: { userId } },
    });

    for (const acc of accounts) {
      const exists = await this.checkInstallationExists(acc.installationId);

      if (!exists) {
        acc.status = GithubAccountStatus.DISCONNECTED;
        acc.disconnectedAt = new Date();
      } else if (acc.status === GithubAccountStatus.DISCONNECTED) {
        acc.status = GithubAccountStatus.ACTIVE;
        acc.disconnectedAt = null;
      }

      await this.githubAccountRepository.save(acc);
    }
  }

  private async checkInstallationExists(
    installationId: string,
  ): Promise<boolean> {
    try {
      const jwt = this.authService.generateAppJwt();

      await firstValueFrom(
        this.http.get(
          `https://api.github.com/app/installations/${installationId}`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
              Accept: 'application/vnd.github+json',
            },
          },
        ),
      );

      return true;
    } catch (err: any) {
      if (err.response?.status === 404) return false;
      throw err;
    }
  }

  private async fetchInstallationDetails(installationId: string) {
    const jwt = this.authService.generateAppJwt();

    const res = await firstValueFrom(
      this.http.get(
        `https://api.github.com/app/installations/${installationId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: 'application/vnd.github+json',
          },
        },
      ),
    );

    return res.data;
  }

  async unlinkAccount(jwtUser: JwtUser, accountId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(GithubAccount, {
        where: { id: accountId },
        relations: ['user'],
      });

      if (!account) {
        throw new AppException(
          ExceptionCodes.GITHUB_ACCOUNT_NOT_FOUND,
          'GitHub account not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (account.user.userId !== jwtUser.userId) {
        throw new AppException(
          ExceptionCodes.UNAUTHORIZED_REPO_DELETION,
          'This operation is not allowed for your account',
          HttpStatus.FORBIDDEN,
        );
      }

      // Fetch repos
      const repos = await manager.find(GithubRepository, {
        where: { githubAccount: { id: accountId } },
        select: ['id'],
      });

      const repoIds = repos.map((r) => r.id);

      if (repoIds.length > 0) {
        // Delete selections FIRST (FK dependency)
        await manager.delete(UserRepositorySelection, {
          repository: { id: In(repoIds) },
        });

        // Delete repos
        await manager.delete(GithubRepository, {
          id: In(repoIds),
        });
      }

      // Soft disconnect account (do this LAST)
      account.status = GithubAccountStatus.DISCONNECTED;
      account.disconnectedAt = new Date();

      await manager.save(account);
    });
  }

  async handleInstallationDeleted(installationId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(GithubAccount, {
        where: { installationId },
      });

      if (!account) {
        // Idempotency: webhook might be retried
        this.logger.warn(
          `Installation not found (already deleted?) | installationId=${installationId}`,
        );
        return;
      }

      this.logger.log(
        `Deleting GitHub account and related data | accountId=${account.id}`,
      );

      // If CASCADE is configured, this is enough:
      await manager.delete(GithubAccount, { id: account.id });
    });
  }

  async getUserAccounts(userId: string): Promise<GithubAccountResponseDto[]> {
    const accounts = await this.githubAccountRepository.find({
      where: { user: { userId }, status: GithubAccountStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    return accounts.map(this.mapToDto);
  }

  private async getAccountDetails(
    installationId: string,
    appJwt: string,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(
          `https://api.github.com/app/installations/${installationId}`,
          {
            headers: {
              Authorization: `Bearer ${appJwt}`,
              Accept: 'application/vnd.github+json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleGithubError(error);
    }
  }

  private handleGithubError(error: unknown): never {
    this.logger.error('Error occurred when fetching GitHub account', error);

    if (error instanceof AxiosError) {
      if (error.response) {
        const status = error.response.status;

        // Rate limiting
        if (status === 403) {
          throw new AppException(
            ExceptionCodes.GITHUB_RATE_LIMIT,
            'GitHub rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        // Invalid installation / token
        if (status === 404) {
          throw new AppException(
            ExceptionCodes.GITHUB_INSTALLATION_NOT_FOUND,
            'GitHub installation not found',
            HttpStatus.NOT_FOUND,
          );
        }

        throw new AppException(
          ExceptionCodes.GITHUB_API_ERROR,
          `GitHub error (${status}): ${error.response.data?.message}`,
          status,
        );
      }

      // Network error
      throw new AppException(
        ExceptionCodes.GITHUB_UNAVAILABLE,
        'Unable to reach GitHub',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    throw new AppException(
      ExceptionCodes.GITHUB_UNAVAILABLE,
      'Unexpected error while communicating with GitHub',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private mapToDto(account: GithubAccount): GithubAccountResponseDto {
    return {
      id: account.id,
      login: account.loginId,
      githubAccountId: account.githubAccountId,
      installationId: account.installationId,
      accountType: account.accountType,
      createdAt: account.createdAt,
    };
  }
}
