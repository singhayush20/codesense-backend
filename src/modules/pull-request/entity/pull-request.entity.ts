import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { GithubRepository } from "../../github-integration/entity/github-repo.entity";
import { PrState } from "../enums/pr-state.enum";
import { PullRequestReview } from "./pull-request-review.entity";

@Entity('pull_requests')
@Unique(['repository', 'prNumber'])
export class PullRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => GithubRepository, (repository) => repository.pullRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'repo_id' })
  repository!: GithubRepository;

  @OneToMany(() => PullRequestReview, (review) => review.pullRequest, {
    cascade: true,
  })
  reviews!: PullRequestReview[];

  @Column({ name: 'pr_number', nullable: false })
  prNumber!: number;

  @Column({ name: 'title', nullable: false })
  title!: string;

  @Column({ name: 'state', nullable: false })
  state!: PrState;

  @Column({ name: 'author', nullable: false })
  author!: string;

  @Column({ name: 'base_branch', nullable: false })
  baseBranch!: string;

  @Column({ name: 'head_branch', nullable: false })
  headBranch!: string;

  @Column({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'merged_at' })
  mergedAt?: Date;

  @Column({ name: 'last_synced' })
  lastSynced!: Date;
}