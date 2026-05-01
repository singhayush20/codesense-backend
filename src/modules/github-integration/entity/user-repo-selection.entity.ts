import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../user/entity/user.entity';
import { GithubRepository } from './github-repo.entity';

@Entity('user_repo_selection')
@Index(['user', 'repository'], { unique: true })
export class UserRepositorySelection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.repositorySelections, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => GithubRepository, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'repository_id' })
  repository!: GithubRepository;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
