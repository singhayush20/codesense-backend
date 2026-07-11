import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../../exception-handling/exception-codes';
import { REVIEW_WORKFLOW } from '../../../definition/review-workflow.definition';
import { ReviewRunWorkflowDto } from '../../../dto/review/review-workflow.dto';
import { PullRequestReviewJob } from '../../../entity/pull-request-review-job.entity';

@Injectable()
export class ReviewWorkflowQueryService {
  constructor(
    @InjectRepository(PullRequestReviewJob)
    private readonly reviewJobRepository: Repository<PullRequestReviewJob>,
  ) {}

  async findByRunId(runId: string): Promise<ReviewRunWorkflowDto> {
    const reviewJob = await this.reviewJobRepository.findOne({
      where: {
        runId,
      },
      relations: ['pullRequest', 'steps'],
    });

    if (!reviewJob) {
      throw new AppException(
        ExceptionCodes.REVIEW_RUN_NOT_FOUND,
        `Review run not found: ${runId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const stepOrder = new Map(
      REVIEW_WORKFLOW.map((step, index) => [step, index] as const),
    );

    return {
      run: {
        runId: reviewJob.runId,
        status: reviewJob.status,
        provider: reviewJob.providerType,
        pullRequestId: reviewJob.pullRequest.id,
        headSha: reviewJob.headSha,
        baseSha: reviewJob.baseSha,
        createdAt: reviewJob.createdAt,
      },
      steps: (reviewJob.steps ?? [])
        .sort(
          (left, right) =>
            (stepOrder.get(left.step) ?? 0) - (stepOrder.get(right.step) ?? 0),
        )
        .map((step) => ({
          step: step.step,
          status: step.status,
          startedAt: step.startedAt,
          completedAt: step.completedAt,
          durationMs: step.durationMs,
          errorMessage: step.errorMessage,
        })),
    };
  }
}
