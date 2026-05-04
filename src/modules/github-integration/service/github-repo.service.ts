import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { GithubRepository } from '../entity/github-repo.entity';
import { GithubInstallation } from '../entity/github-installation.entity';
import { JwtUser } from '../../auth/decorator/current-user.decorator';

import { GithubInstallationTokenService } from './github-installation-token.service';

import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { GithubApiService } from './github-api.service';
import { GithubRepoResponseDto } from '../dtos/github-repo-response.dto';
import { SyncReposResponseDto } from '../dtos/sync-repo-response.dto';
import { GithubRepoDto } from '../dtos/github-api/github-installation-repos-api-response.dto';

@Injectable()
export class GithubRepoService {
  constructor(
    @InjectRepository(GithubRepository)
    private readonly repoRepo: Repository<GithubRepository>,

    @InjectRepository(GithubInstallation)
    private readonly installationRepo: Repository<GithubInstallation>,

    private readonly tokenService: GithubInstallationTokenService,
    private readonly githubApi: GithubApiService,
  ) {}

  async syncRepositoriesByInstallationId(
    jwtUser: JwtUser,
    installationId: string,
  ): Promise<SyncReposResponseDto> {
    const installation: GithubInstallation | null  = await this.installationRepo.findOne({
      where: { installationId },
      relations: ['account', 'account.user'],
    });

    if (!installation) {
      throw new AppException(
        ExceptionCodes.GITHUB_INSTALLATION_NOT_FOUND,
        'Installation not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (installation.account.user.userId !== jwtUser.userId) {
      throw new AppException(
        ExceptionCodes.GITHUB_ACCESS_DENIED,
        'Access denied',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!installation.isActive) {
      throw new AppException(
        ExceptionCodes.GITHUB_INSTALLATION_INACTIVE,
        'Inactive installation',
        HttpStatus.FORBIDDEN,
      );
    }

    const token = await this.tokenService.getToken(installation.installationId);

    let page = 1;
    const perPage = 100;
    const allRepos: GithubRepoDto[] = [];

    while (true) {
      const repos = await this.githubApi.getInstallationRepos(
        token,
        page,
        perPage,
      );

      if (!repos.length) break;

      allRepos.push(...repos);

      if (repos.length < perPage) break;
      page++;
    }

    const entities = allRepos.map((repo) : GithubRepository =>
      this.repoRepo.create({
        githubRepoId: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        installation,
        isPrivate: repo.private,
        permissions: repo.permissions,
      }),
    );

    await this.repoRepo.upsert(entities, ['githubRepoId', 'installation']);

    const savedRepos = await this.repoRepo.find({
      where: {
        installation: { id: installation.id },
        githubRepoId: In(entities.map((e) => e.githubRepoId)),
      },
    });
    
    const repos: GithubRepoResponseDto[] = savedRepos.map(
      (repo): GithubRepoResponseDto => ({
        id: repo.id,
        repoId: repo.githubRepoId,
        name: repo.name,
        fullName: repo.fullName,
        isPrivate: repo.isPrivate,
        permissions: repo.permissions,
      }),
    );
  
    return {
      total: repos.length,
      repositories: repos,
    };
  }
}
