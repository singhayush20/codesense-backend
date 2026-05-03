import { Injectable, ForbiddenException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { UserRepositorySelection } from '../entity/user-repo-selection.entity';
import { GithubRepository } from '../entity/github-repo.entity';
import { JwtUser } from '../../auth/decorator/current-user.decorator';

import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { UserService } from '../../user/service/user.service';

export interface SelectedRepoDto {
  id: string;
  repoId: string;
  name: string;
  fullName: string;
}

export interface SelectRepositoriesResponse {
  count: number;
  repositories: SelectedRepoDto[];
}

@Injectable()
export class GithubSelectionService {
  constructor(
    @InjectRepository(UserRepositorySelection)
    private readonly selectionRepo: Repository<UserRepositorySelection>,

    @InjectRepository(GithubRepository)
    private readonly repoRepo: Repository<GithubRepository>,

    private readonly userService: UserService,
  ) {}

  async selectRepositories(
    jwtUser: JwtUser,
    installationId: string,
    repoIds: string[],
  ): Promise<SelectRepositoriesResponse> {
    const user = await this.userService.findUserById(jwtUser.userId);

    if (!user) {
      throw new AppException(
        ExceptionCodes.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const repos = await this.repoRepo.find({
      where: {
        id: In(repoIds),
        installation: { installationId },
      },
      relations: [
        'installation',
        'installation.account',
        'installation.account.user',
      ],
    });

    if (repos.length !== repoIds.length) {
      throw new AppException(
        ExceptionCodes.REPO_NOT_FOUND,
        'Some repos not found',
        HttpStatus.NOT_FOUND,
      );
    }

    for (const repo of repos) {
      if (repo.installation.account.user.userId !== user.userId) {
        throw new ForbiddenException(`Access denied for repo ${repo.id}`);
      }
    }

    const selections = repos.map((repo) =>
      this.selectionRepo.create({
        user,
        repository: repo,
      }),
    );

    await this.selectionRepo.upsert(selections, ['user', 'repository']);

    return {
      count: repos.length,
      repositories: repos.map((r) => this.mapToDto(r)),
    };
  }

  async unselectRepositories(
    jwtUser: JwtUser,
    installationId: string,
    repoIds: string[],
  ): Promise<SelectRepositoriesResponse> {
    const user = await this.userService.findUserById(jwtUser.userId);

    if (!user) {
      throw new AppException(
        ExceptionCodes.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Fetch selections (NO isActive anymore)
    const selections = await this.selectionRepo.find({
      where: {
        user: { userId: user.userId },
        repository: {
          id: In(repoIds),
          installation: { installationId },
        },
      },
      relations: [
        'repository',
        'repository.installation',
        'repository.installation.account',
        'repository.installation.account.user',
      ],
    });

    if (selections.length !== repoIds.length) {
      throw new AppException(
        ExceptionCodes.REPO_NOT_FOUND,
        'Some selected repositories not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Ownership + installation validation
    for (const selection of selections) {
      const repo = selection.repository;

      if (repo.installation.account.user.userId !== user.userId) {
        throw new ForbiddenException(`Access denied for repo ${repo.id}`);
      }

      if (!repo.installation.isActive) {
        throw new ForbiddenException(
          `Installation inactive for repo ${repo.id}`,
        );
      }
    }

    // Collect repo DTOs BEFORE delete
    const responseRepos = selections.map((s) => this.mapToDto(s.repository));

    // Hard delete
    await this.selectionRepo.delete({
      user: { userId: user.userId },
      repository: {
        id: In(repoIds),
        installation: { installationId },
      },
    });

    return {
      count: responseRepos.length,
      repositories: responseRepos,
    };
  }

  async getUserSelections(userId: string): Promise<SelectedRepoDto[]> {
    const selections = await this.selectionRepo.find({
      where: { user: { userId } },
      relations: ['repository'],
    });

    return selections.map((s) => this.mapToDto(s.repository));
  }

  async isRepoSelectedForInstallation(
    githubRepoId: string,
    installationId: string,
  ): Promise<boolean> {
    const count = await this.selectionRepo
      .createQueryBuilder('selection')
      .innerJoin('selection.repository', 'repo')
      .innerJoin('repo.installation', 'installation')
      .where('repo.githubRepoId = :repoId', { repoId: githubRepoId })
      .andWhere('installation.installationId = :installationId', {
        installationId,
      })
      .getCount();

    return count > 0;
  }

  private mapToDto(repo: GithubRepository): SelectedRepoDto {
    return {
      id: repo.id,
      repoId: repo.githubRepoId,
      name: repo.name,
      fullName: repo.fullName,
    };
  }
}
