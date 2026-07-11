import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PullRequestReviewStep } from '../entity/pull-request-review-step.entity';

@Injectable()
export class PullRequestReviewStepRepository {
  constructor(
    @InjectRepository(PullRequestReviewStep)
    private readonly repository: Repository<PullRequestReviewStep>,
  ) {}

  findByRunId(runId: string): Promise<PullRequestReviewStep[]> {
    return this.repository.find({
      where: {
        job: {
          runId,
        },
      },
      relations: ['job'],
      order: {
        id: 'ASC',
      },
    });
  }
}
