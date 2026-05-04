import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GithubRepository } from '../../github-integration/entity/github-repo.entity';
import { LLMProvider } from '../entity/llm-provider.entity';
import { RepoLlmConfig } from '../entity/repo-llm-config.entity';

import { RepoLlmConfigResponseDto } from '../dtos/repo-llm-config-response.dto';
import { SetRepoConfigDto } from '../dtos/set-repo-config.dto';

import { RepoConfigErrors } from '../exceptions/repo-config.exceptions';
import { RepoConfigUtil } from '../utils/repo-config.util';

@Injectable()
export class RepoLlmConfigService {
  constructor(
    @InjectRepository(RepoLlmConfig)
    private readonly repoConfigRepo: Repository<RepoLlmConfig>,

    @InjectRepository(LLMProvider)
    private readonly providerRepo: Repository<LLMProvider>,
  ) {}

  /**
   * Create or update repo-level LLM config
   */
  async upsert(
    userId: string,
    repoId: string,
    dto: SetRepoConfigDto,
  ): Promise<RepoLlmConfigResponseDto> {
    const provider = await this.providerRepo.findOne({
      where: {
        publicId: dto.providerId,
        user: { userId },
      },
      relations: ['credential'],
    });

    if (!provider) throw RepoConfigErrors.providerNotFound();
    if (!provider.isActive) throw RepoConfigErrors.providerInactive();
    if (!provider.credential?.isValid)
      throw RepoConfigErrors.invalidCredentials();

    RepoConfigUtil.validateModel(dto.model);

    let config = await this.repoConfigRepo
      .createQueryBuilder('config')
      .innerJoin('config.repository', 'repo')
      .innerJoin('repo.installation', 'installation')
      .innerJoin('installation.account', 'account')
      .innerJoin('account.user', 'user')
      .where('repo.id = :repoId', { repoId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!config) {
      const repo = await this.getOwnedRepoOrThrow(userId, repoId);

      config = this.repoConfigRepo.create({
        repository: repo,
        provider,
        model: dto.model,
      });
    } else {
      config.provider = provider;
      config.model = dto.model;
    }

    const saved = await this.repoConfigRepo.save(config);

    return this.toDto(saved, provider);
  }

  /**
   * Get repo config
   */
  async get(userId: string, repoId: string): Promise<RepoLlmConfigResponseDto> {
    const config = await this.repoConfigRepo
      .createQueryBuilder('config')
      .innerJoinAndSelect('config.repository', 'repo')
      .innerJoinAndSelect('config.provider', 'provider')
      .innerJoinAndSelect('provider.credential', 'credential')
      .innerJoin('repo.installation', 'installation')
      .innerJoin('installation.account', 'account')
      .innerJoin('account.user', 'user')
      .where('repo.id = :repoId', { repoId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!config) throw RepoConfigErrors.configNotFound();

    if (!config) throw RepoConfigErrors.configNotFound();

    return this.toDto(config, config.provider);
  }

  /**
   * Delete repo config
   */
  async delete(userId: string, repoId: string): Promise<void> {
    const config = await this.repoConfigRepo
      .createQueryBuilder('config')
      .innerJoin('config.repository', 'repo')
      .innerJoin('repo.installation', 'installation')
      .innerJoin('installation.account', 'account')
      .innerJoin('account.user', 'user')
      .where('repo.id = :repoId', { repoId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!config) throw RepoConfigErrors.configNotFound();

    await this.repoConfigRepo.remove(config);

    if (!config) throw RepoConfigErrors.configNotFound();

    await this.repoConfigRepo.remove(config);
  }

  private async getOwnedRepoOrThrow(
    userId: string,
    repoId: string,
  ): Promise<GithubRepository> {
    const repo = await this.repoConfigRepo.manager
      .getRepository(GithubRepository)
      .createQueryBuilder('repo')
      .innerJoin('repo.installation', 'installation')
      .innerJoin('installation.account', 'account')
      .innerJoin('account.user', 'user')
      .where('repo.id = :repoId', { repoId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!repo) throw RepoConfigErrors.repoNotFound();

    return repo;
  }

  private toDto(
    config: RepoLlmConfig,
    provider: LLMProvider,
  ): RepoLlmConfigResponseDto {
    return {
      repoId: config.repository.id,
      providerId: provider.publicId,
      providerType: provider.providerType,
      displayName: provider.displayName,
      model: config.model,
      isActive: provider.isActive,
      isValid: provider.credential?.isValid ?? false,
    };
  }
}
