import { Injectable, ForbiddenException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GithubRepository } from '../entity/github-repo.entity';
import { GithubInstallation } from '../entity/github-installation.entity';
import { JwtUser } from '../../auth/decorator/current-user.decorator';

import { GithubInstallationTokenService } from './github-installation-token.service';

import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { GithubApiService, GithubRepoDto } from './github-api.service';

export interface SyncReposResponse {
  count: number;
}

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
  ): Promise<SyncReposResponse> {
    const installation = await this.installationRepo.findOne({
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
      throw new ForbiddenException('Access denied');
    }

    if (!installation.isActive) {
      throw new ForbiddenException('Inactive installation');
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

    const entities = allRepos.map((repo) =>
      this.repoRepo.create({
        githubRepoId: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        installation,
      }),
    );

    await this.repoRepo.upsert(entities, ['githubRepoId', 'installation']);

    return { count: entities.length };
  }
}
