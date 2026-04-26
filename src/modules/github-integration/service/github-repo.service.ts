import {
    HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GithubInstallationTokenService } from './github-installation-token.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { GithubRepository } from '../entity/github-repo.entity';
import { Repository } from 'typeorm';
import { GithubAccount } from '../entity/github-account.entity';
import { GithubRepoResponseDto } from '../dtos/github-repo-response.dto';
import { SyncReposResponseDto } from '../dtos/sync-repo-response.dto';
import { GithubInstallationReposResponse } from '../dtos/github-installation-repo-response';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { User } from '../../user/entity/user.entity';
import { JwtUser } from '../../auth/decorator/current-user.decorator';
import { UserService } from '../../user/service/user.service';

@Injectable()
export class GithubRepoService {
  constructor(
    private tokenService: GithubInstallationTokenService,
    private http: HttpService,
    @InjectRepository(GithubRepository)
    private repoRepository: Repository<GithubRepository>,
    @InjectRepository(GithubAccount)
    private accountRepository: Repository<GithubAccount>,
    private userService: UserService,
  ) {}

  private readonly logger = new Logger(GithubRepoService.name);

  async syncRepositories(
    account: GithubAccount,
  ): Promise<SyncReposResponseDto> {
    let githubResponse: GithubInstallationReposResponse;

    try {
      const token = await this.tokenService.getToken(account.installationId);

      const response = await firstValueFrom(
        this.http.get<GithubInstallationReposResponse>(
          `https://api.github.com/installation/repositories`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );

      githubResponse = response.data;
    } catch (error) {
      this.logger.error('Failed to fetch repositories from GitHub', error);
      throw new AppException(
        ExceptionCodes.GITHUB_API_ERROR,
        'Failed to fetch repositories from GitHub',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const entities = githubResponse.repositories.map((r) =>
      this.repoRepository.create({
        githubAccount: account,
        repoId: r.id.toString(),
        name: r.name,
        fullName: r.full_name,
        isPrivate: r.private,
        permissions: r.permissions,
      }),
    );

    try {
      await this.repoRepository.upsert(entities, ['githubAccount', 'repoId']);
    } catch (error) {
      throw new InternalServerErrorException('Failed to persist repositories');
    }

    // Fetch persisted entities (clean return)
    const saved = await this.repoRepository.find({
      where: { githubAccount: { id: account.id } },
    });

    return {
      total: saved.length,
      repositories: saved.map(this.mapToDto),
    };
  }

  async syncRepositoriesByAccountId(
    jwtUser: JwtUser,
    accountId: string,
  ): Promise<SyncReposResponseDto> {
    const user = await this.userService.findUserById(jwtUser.userId);

    if (!user) {
      throw new AppException(
        ExceptionCodes.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Fetch account
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: ['user'],
    });

    if (!account) {
      throw new NotFoundException('GitHub account not found');
    }

    // Ownership validation
    if (account.user.userId !== user.userId) {
      throw new AppException(ExceptionCodes.UNAUTHORIZED_ACCESS,'Access denied to this account',HttpStatus.FORBIDDEN);
    }

    // Delegate to core logic
    return this.syncRepositories(account);
  }

  async findByRepoId(repoId: string): Promise<GithubRepository> {
    const repo = await this.repoRepository.findOne({
      where: { repoId },
      relations: ['githubAccount', 'githubAccount.user'],
    });

    if (!repo) {
      throw new NotFoundException(`Repository with repoId ${repoId} not found`);
    }

    return repo;
  }

  async findByRepoIdDto(repoId: string): Promise<GithubRepoResponseDto> {
    const repo = await this.findByRepoId(repoId);
    return this.mapToDto(repo);
  }

  private mapToDto(repo: GithubRepository): GithubRepoResponseDto {
    return {
      id: repo.id,
      repoId: repo.repoId,
      name: repo.name,
      fullName: repo.fullName,
      isPrivate: repo.isPrivate,
      permissions: repo.permissions,
    };
  }
}
