import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectPinoLogger(UserRepository.name)
    private readonly logger: PinoLogger,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug({ email }, 'Finding user by email');

    return this.repo.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    this.logger.debug({ email }, 'Checking if user exists by email');

    const count = await this.repo.count({ where: { email } });
    return count > 0;
  }

  async save(user: User): Promise<User> {
    this.logger.debug({ userId: user.userId }, 'Saving user');

    return this.repo.save(user);
  }

  create(data: Partial<User>): User {
    return this.repo.create(data);
  }
}
