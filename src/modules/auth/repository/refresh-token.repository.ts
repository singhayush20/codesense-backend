import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { RefreshToken } from '../entity/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private repo: Repository<RefreshToken>,
  ) {}

  async findByTokenHash(tokenHash: string) {
    return this.repo.findOne({
      where: { tokenHash },
      relations: [`user`],
    });
  }

  async revokeSession(sessionId: string, revokedAt: Date) {
    await this.repo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt })
      .where('session_id = :sessionId', { sessionId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  async save(token: DeepPartial<RefreshToken>) {
    return this.repo.save(token);
  }
}
