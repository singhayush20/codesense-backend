import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PullRequestFile } from './pull-request-file.entity';

@Entity('pull_request_file_snapshots')
@Index(['expiresAt'])
export class PullRequestFileSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => PullRequestFile,
    (pullRequestFile) => pullRequestFile.snapshots,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({
    name: 'pull_request_file_id',
  })
  pullRequestFile!: PullRequestFile;

  @Column({
    name: 'content',
    type: 'text',
  })
  content!: string;

  @Column({
    nullable: false,
  })
  sha!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt!: Date;

  @Column({
    name: 'expired_at',
    type: 'timestamptz',
    nullable: false,
  })
  expiresAt!: Date;
}
