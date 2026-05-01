import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';

import { Role } from '../entity/role.entity';
import { UserRole } from '../entity/user-role.entity';
import { User } from '../entity/user.entity';
import { RoleTypes } from '../enums/role-types.enums';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async findUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { userId },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
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
    const existing = await this.userRepository.findOne({ where: { email } });

    if (existing) {
      throw new ConflictException(`User already exists`);
    }

    // fetch roles
    const roles = await this.roleRepository.find({
      where: {
        name: In([RoleTypes.ROLE_USER]),
      },
    });

    if (!roles.length) {
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

    return savedUser;
  }

  async findByIdWithRoles(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { userId },
      relations: ['userRoles', 'userRoles.role'],
    });
  }
}
