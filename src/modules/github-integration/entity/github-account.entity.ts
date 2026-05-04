import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { GithubAccountType } from '../enums/github-account-types.enum';
import { GithubInstallation } from './github-installation.entity';

@Entity('github_accounts')
@Index(['user'])
@Index(['user', 'githubAccountId'], { unique: true })
@Unique(['githubAccountId'])
export class GithubAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.githubAccounts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'bigint' })
  githubAccountId!: string;

  @Column({ nullable: false, unique: true })
  loginId!: string;

  @Column({
    type: 'enum',
    enum: GithubAccountType,
    enumName: 'github_account_type_enum',
  })
  accountType!: GithubAccountType;

  @Column({ default: true })
  isConnected!: boolean;

  @OneToOne(() => GithubInstallation, (inst) => inst.account)
  installation!: GithubInstallation;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
