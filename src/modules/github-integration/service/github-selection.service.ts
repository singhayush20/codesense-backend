import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepositorySelection } from '../entity/user-repo-selection.entity';
import { Repository, In } from 'typeorm';
import { GithubRepository } from '../entity/github-repo.entity';
import { SelectRepositoriesResponseDto } from '../dtos/select-repositories-response.dto';
import { SelectedRepoResponseDto } from '../dtos/selected-repo-response.dto';
import { JwtUser } from '../../auth/decorator/current-user.decorator';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { UserService } from '../../user/service/user.service';

@Injectable()
export class GithubSelectionService {
  constructor(
    @InjectRepository(UserRepositorySelection)
    private selectionRepo: Repository<UserRepositorySelection>,
    private userService: UserService,
    @InjectRepository(GithubRepository)
    private repoRepo: Repository<GithubRepository>,
  ) {}

  async selectRepositories(
    jwtUser: JwtUser,
    repoIds: string[],
  ): Promise<SelectRepositoriesResponseDto> {
    const user = await this.userService.findUserById(jwtUser.userId);

    if (!user) {
      throw new AppException(
        ExceptionCodes.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Fetch repos
    const repos = await this.repoRepo.find({
      where: { repoId: In(repoIds) },
      relations: ['githubAccount', 'githubAccount.user'],
    });

    // Validate all repos exist
    if (repos.length !== repoIds.length) {
      throw new AppException(
        ExceptionCodes.REPO_NOT_FOUND,
        'Some repositories not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Ownership validation
    for (const repo of repos) {
      if (repo.githubAccount.user.userId !== user.userId) {
        throw new ForbiddenException(`Access denied for repo ${repo.repoId}`);
      }
    }

    // Prepare selections
    const selections = repos.map((repo) =>
      this.selectionRepo.create({
        user,
        repository: repo,
        isActive: true,
      }),
    );

    // Idempotent upsert
    await this.selectionRepo.upsert(selections, ['user', 'repository']);

    // Return clean DTO
    return {
      count: repos.length,
      repositories: repos.map(this.mapToDto),
    };
  }

  async getUserSelections(userId: string): Promise<SelectedRepoResponseDto[]> {
    const selections = await this.selectionRepo.find({
      where: { user: { userId }, isActive: true },
      relations: ['repository'],
      order: { createdAt: 'DESC' },
    });

    return selections.map((s) => this.mapToDto(s.repository));
  }

  async isRepoSelected(repoId: string): Promise<boolean> {
    const count = await this.selectionRepo.count({
      where: {
        repository: { repoId },
        isActive: true,
      },
    });

    return count > 0;
  }

  private mapToDto(repo: GithubRepository): SelectedRepoResponseDto {
    return {
      id: repo.id,
      repoId: repo.repoId,
      name: repo.name,
      fullName: repo.fullName,
      isPrivate: repo.isPrivate,
    };
  }
}
