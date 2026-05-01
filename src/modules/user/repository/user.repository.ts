// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entity/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repo.count({ where: { email } });

    return count > 0;
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async create(data: Partial<User>): Promise<User> {
    return this.repo.create(data);
  }
}
