import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Role } from './role.entity';
import { User } from './user.entity';

@Entity('user_roles')
@Index(['user', 'role'], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn({ name: 'user_role_id' })
  userRoleId!: number;

  @ManyToOne(() => User, (user) => user.userRoles, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, (role) => role.userRoles, {
    eager: true,
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;
}
