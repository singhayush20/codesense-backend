import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { GithubAccount } from './github-account.entity';
import { UserRepositorySelection } from './user-repo-selection.entity';

/**
 * Represents repositories accessible via a GitHub installation.
 * What repos are available under an installation?
 * What permissions exist on each repo?
 * What repos belong to which GitHub account?
 */
@Entity('github_repositories')
@Index(['githubAccount', 'repoId'], { unique: true })
@Index(['repoId'])
@Index(['githubAccount'])
export class GithubRepository {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => GithubAccount, (account) => account.githubRepositories, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'github_account_id' })
  githubAccount!: GithubAccount;

  @Column({ type: 'bigint' })
  repoId!: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  fullName!: string;

  @Column({ nullable: false })
  isPrivate!: boolean;

  @Column({ type: 'jsonb', nullable: false })
  permissions!: Record<string, any>;

  @OneToMany(() => UserRepositorySelection, (selection) => selection.repository)
  selections!: UserRepositorySelection[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
