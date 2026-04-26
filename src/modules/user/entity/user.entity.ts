import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserRole } from "./user-role.entity";
import { GithubAccount } from "../../github-integration/entity/github-account.entity";
import { UserRepositorySelection } from "../../github-integration/entity/user-repo-selection.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Column({ name: 'name', nullable: false })
  name!: string;

  @Column({ name: 'email', unique: true, nullable: false })
  email!: string;

  @Column({ name: 'password', nullable: false })
  password!: string;

  @OneToMany(() => UserRole, (userRole) => userRole.user, {
    cascade: true,
  })
  userRoles!: UserRole[];

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_verified', default: true })
  isVerified!: boolean;

  @OneToMany(() => GithubAccount, (account) => account.user)
  githubAccounts!: GithubAccount[];

  @OneToMany(() => UserRepositorySelection, (selection) => selection.user)
  repositorySelections!: UserRepositorySelection[];

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  updatedAt!: Date;
}