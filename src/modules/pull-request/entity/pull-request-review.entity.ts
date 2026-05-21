import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PullRequestReviewStatus } from '../enums/pull-request-review-status.enum';
import { PullRequest } from './pull-request.entity';

@Entity('pull_request_reviews')
export class PullRequestReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PullRequest, (pr) => pr.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pull_request_id' })
  pullRequest!: PullRequest;

  @Column({ name: 'provider', nullable: false })
  provider!: string;

  @Column({ name: 'result', type: 'json', nullable: false })
  result!: Record<string, any>;

  @Column({ name: 'status', type: 'varchar', enum: PullRequestReviewStatus })
  status!: PullRequestReviewStatus;

  @Column({ name: 'error', type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date;
}
