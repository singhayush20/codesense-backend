import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PullRequestReviewStatus } from '../enums/pull-request-review-status.enum';
import { PullRequest } from './pull-request.entity';
import { ProviderType } from '../../ai/enums/provider.type';
import { PullRequestReviewJobResult } from './pull-request-review-job-result.entity';

@Entity('pull_request_review_jobs')
export class PullRequestReviewJob {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'run_id', type: 'varchar', nullable: false, unique: true })
  runId!: string;

  @ManyToOne(() => PullRequest, (pr) => pr.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pull_request_id' })
  pullRequest!: PullRequest;

  @OneToOne(() => PullRequestReviewJobResult, (result) => result.job, {
    cascade: true,
  })
  result?: PullRequestReviewJobResult;

  @Column({
    name: 'provider_type',
    type: 'enum',
    enum: ProviderType,
    enumName: 'provider_type_enum',
  })
  providerType!: ProviderType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PullRequestReviewStatus,
    enumName: 'pull_request_review_status_enum',
  })
  status!: PullRequestReviewStatus;

  @Column({ name: 'head_sha', type: 'varchar', nullable: true })
  headSha?: string;

  @Column({ name: 'base_sha', type: 'varchar', nullable: true })
  baseSha?: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date;
}
