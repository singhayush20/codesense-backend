import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../entity/role.entity';
import { UserRole } from '../entity/user-role.entity';
import { User } from '../entity/user.entity';
import { RoleTypes } from '../enums/role-types.enums';
import * as bcrypt from 'bcrypt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectPinoLogger(UserService.name)
    private readonly logger: PinoLogger,
  ) {}

  async findUserById(userId: string): Promise<User | null> {
    this.logger.debug({ userId }, 'Finding user by ID');

    return this.userRepository.findOne({
      where: { userId },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    this.logger.debug({ email }, 'Finding user by email');

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });

    return user;
  }

  async createUser(
    email: string,
    name: string,
    password: string,
  ): Promise<User> {
    this.logger.debug({ email }, 'Creating user');

    const existing = await this.userRepository.findOne({ where: { email } });

    if (existing) {
      this.logger.warn({ email }, 'User already exists, throwing conflict');
      throw new ConflictException(`User already exists`);
    }

    const roles = await this.roleRepository.find({
      where: {
        name: In([RoleTypes.ROLE_USER]),
      },
    });

    if (!roles.length) {
      this.logger.error('Default ROLE_USER role not found');
      throw new NotFoundException(`Roles not found`);
    }

    const user = this.userRepository.create({
      email,
      name,
      password: await bcrypt.hash(password, 10),
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    const userRoles = roles.map((role) =>
      this.userRoleRepository.create({
        user: savedUser,
        role,
      }),
    );

    await this.userRoleRepository.save(userRoles);

    this.logger.info({ userId: savedUser.userId, email }, 'User created');

    return savedUser;
  }

  async findByIdWithRoles(userId: string): Promise<User | null> {
    this.logger.debug({ userId }, 'Finding user by ID with roles');

    return this.userRepository.findOne({
      where: { userId },
      relations: ['userRoles', 'userRoles.role'],
    });
  }
}
