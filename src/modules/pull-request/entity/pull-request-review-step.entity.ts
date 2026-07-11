import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ReviewWorkflowStep } from '../enums/review-workflow-step.enum';
import { ReviewWorkflowStepStatus } from '../enums/review-workflow-step-status.enum';
import { PullRequestReviewJob } from './pull-request-review-job.entity';

@Entity('pull_request_review_steps')
@Unique(['job', 'step'])
@Index(['job'])
@Index(['status'])
export class PullRequestReviewStep {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => PullRequestReviewJob, (job) => job.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job!: PullRequestReviewJob;

  @Column({
    name: 'step',
    type: 'enum',
    enum: ReviewWorkflowStep,
    enumName: 'review_workflow_step_enum',
  })
  step!: ReviewWorkflowStep;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ReviewWorkflowStepStatus,
    enumName: 'review_workflow_step_status_enum',
  })
  status!: ReviewWorkflowStepStatus;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs?: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date;
}
