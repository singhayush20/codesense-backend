import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserRepositorySelection } from "./user-repo-selection.entity";
import { GithubInstallation } from "./github-installation.entity";

/**
 * Represents repositories accessible via a GitHub installation.
 * What repos are available under an installation?
 * What permissions exist on each repo?
 * What repos belong to which GitHub account?
 */
@Entity('github_repositories')
@Index(['githubRepoId'])
@Index(['installation'])
@Index(['githubRepoId', 'installation'], { unique: true })
export class GithubRepository {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => GithubInstallation,
    (installation) => installation.repositories,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'installation_id' })
  installation!: GithubInstallation;

  @Column({ type: 'bigint' })
  githubRepoId!: string;

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
