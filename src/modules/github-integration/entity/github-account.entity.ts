import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { GithubRepository } from "./github-repo.entity";
import { User } from "../../user/entity/user.entity";
import { GithubAccountType } from "../enums/github-account-types.enum";
import { GithubAccountStatus } from "../enums/github-account-status.enum";

/**  
 * Represents a GitHub App installation linked to a user.
 * Which GitHub accounts are connected?
 * Which installations exist for a user?
 * Which installation ID should be used to fetch data?
*/
@Entity('github_accounts')
@Index(['user'])
@Index(['user', 'githubAccountId'], { unique: true })
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

  @Column({ unique: true, nullable: false })
  loginId!: string;

  @Column({
    type: 'enum',
    enum: GithubAccountType,
    enumName: 'github_account_type_enum',
    nullable: false,
  })
  accountType!: GithubAccountType;

  @Column({ type: 'bigint', unique: true, nullable: false })
  installationId!: string;

  @OneToMany(() => GithubRepository, (repository) => repository.githubAccount)
  githubRepositories!: GithubRepository[];

  @Column({
    type: 'enum',
    enum: GithubAccountStatus,
    enumName: 'github_account_status_enum',
    default: GithubAccountStatus.ACTIVE,
  })
  status!: GithubAccountStatus;

  @Column({name: 'disconnected_at', type: 'timestamp', nullable: true })
  disconnectedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
