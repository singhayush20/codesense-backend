import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PullRequestReviewJob } from './pull-request-review-job.entity';

@Entity('pull_request_review_job_results')
export class PullRequestReviewJobResult {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @OneToOne(() => PullRequestReviewJob, (job) => job.result, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job!: PullRequestReviewJob;

  @Column({ name: 'total_input_tokens', type: 'int', nullable: false })
  totalInputTokens!: number;

  @Column({ name: 'total_output_tokens', type: 'int', nullable: false })
  totalOutputTokens!: number;

  @Column({ name: 'total_tokens', type: 'int', nullable: false })
  totalTokens!: number;

  @Column({ name: 'comments', type: 'json', nullable: false })
  comments!: Record<string, any>[];

  @Column({ name: 'summary', type: 'text', nullable: false })
  summary!: string;
}
