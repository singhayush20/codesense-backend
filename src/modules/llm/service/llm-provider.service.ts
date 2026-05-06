import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LLMProvider } from '../entity/llm-provider.entity';
import { CreateProviderDto } from '../dtos/create-provider.dto';
import { User } from '../../user/entity/user.entity';
import {
  ProviderListResponseDto,
  ProviderResponseDto,
} from '../dtos/provider-response.dto';

@Injectable()
export class LlmProviderService {
  constructor(
    @InjectRepository(LLMProvider)
    private readonly repo: Repository<LLMProvider>,
  ) {}

  async create(userId: string, dto: CreateProviderDto) {
    const provider = this.repo.create({
      providerType: dto.providerType,
      displayName: dto.displayName,
      user: { userId: userId } as User,
    });

    return this.repo.save(provider);
  }

  async getAll(userId: string): Promise<ProviderListResponseDto[]> {
    const providers = await this.repo.find({
      where: { user: { userId } },
      relations: ['credential'],
    });

    const mappedProviders: ProviderResponseDto[] = providers.map((provider: LLMProvider): ProviderResponseDto => ({
      id: provider.publicId,
      providerType: provider.providerType,
      displayName: provider.displayName,
      isActive: provider.isActive,
      isValid: provider.credential?.isValid ?? false,
      keyFingerprint: provider.credential?.keyFingerprint || null,
    }));

    const groupedByType = mappedProviders.reduce(
      (acc, provider) => {
        const existing = acc.find((g) => g.providerType === provider.providerType);
        if (existing) {
          existing.providers.push(provider);
        } else {
          acc.push({
            providerType: provider.providerType,
            providers: [provider],
          });
        }
        return acc;
      },
      [] as ProviderListResponseDto[],
    );

    return groupedByType;
  }

  async delete(providerPublicId: string, userId: string) {
    const provider = await this.repo.findOne({
      where: {
        publicId: providerPublicId,
        user: { userId: userId },
      },
    });

    if (!provider) {
      throw new NotFoundException();
    }

    await this.repo.remove(provider);
  }
}
