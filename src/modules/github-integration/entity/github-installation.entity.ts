import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GithubAccount } from './github-account.entity';
import { GithubRepository } from './github-repo.entity';

@Entity('github_installations')
@Index(['installationId'], { unique: true })
@Index(['account'])
export class GithubInstallation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => GithubAccount, (account) => account.installation, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: GithubAccount;

  // GitHub installation id (external)
  @Column({ type: 'bigint' })
  installationId!: string;

  // GitHub target (user/org id)
  @Column({ type: 'bigint' })
  targetId!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => GithubRepository, (repo) => repo.installation)
  repositories!: GithubRepository[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
