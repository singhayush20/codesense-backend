import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { GithubRepository } from '../../github-integration/entity/github-repo.entity';
import { LLMProvider } from './llm-provider.entity';

@Entity('repo_llm_config')
@Unique(['repository'])
export class RepoLlmConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => GithubRepository, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'repository_id' })
  repository!: GithubRepository;

  @ManyToOne(() => LLMProvider, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider!: LLMProvider;

  @Column({ name: 'model_name', type: 'varchar', length: 100 })
  model!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
