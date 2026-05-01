import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LLMProvider } from '../entity/llm-provider.entity';
import { CreateProviderDto } from '../dtos/create-provider.dto';
import { User } from '../../user/entity/user.entity';
import { ProviderResponseDto } from '../dtos/provider-response.dto';

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

  async getAll(userId: string): Promise<ProviderResponseDto[]> {
    const providers = await this.repo.find({
      where: { user: { userId } },
      relations: ['credential'],
    });

    return providers.map((p) => ({
      id: p.publicId,
      providerType: p.providerType,
      displayName: p.displayName,
      isActive: p.isActive,
      isValid: p.credential?.isValid ?? false,
      keyFingerprint: p.credential?.keyFingerprint ?? null,
    }));
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
