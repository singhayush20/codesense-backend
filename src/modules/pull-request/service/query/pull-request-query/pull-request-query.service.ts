import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../../../../dtos/paginated-response.dto';
import { PaginationUtil } from '../../../../../utils/pagination.utils';
import { PullRequestListItemDto } from '../../../dto/query/pull-request-list-item.dto';
import { PullRequest } from '../../../entity/pull-request.entity';
import { PullRequestQueryMapper } from '../../../mapper/pull-request-query.mapper';
import { PullRequestQueryRequestDto } from '../../../dto/query/pull-request-query-request.dto';
import { PullRequestDetailsDto } from '../../../dto/query/pull-request-details.dto';
import { PullRequestReviewJob } from '../../../entity/pull-request-review-job.entity';
import {
  ReviewCommentResponseDto,
  ReviewResultsResponseDto,
} from '../../../dto/review/pr-review-comment.dto';
import { PullRequestSyncService } from '../../sync/pull-request-sync/pull-request-sync.service';
import { AppException } from '../../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../../exception-handling/exception-codes';

@Injectable()
export class PullRequestQueryService {
  constructor(
    @InjectRepository(PullRequest)
    private readonly pullRequestRepository: Repository<PullRequest>,
    @InjectRepository(PullRequestReviewJob)
    private readonly pullRequestReviewJobRepository: Repository<PullRequestReviewJob>,
    private readonly pullRequestSyncService: PullRequestSyncService,
  ) {}

  async getReviewsForPullRequest(
    pullRequestId: string,
  ): Promise<ReviewResultsResponseDto[]> {
    const reviews: PullRequestReviewJob[] =
      await this.pullRequestReviewJobRepository.find({
        where: {
          pullRequest: {
            id: pullRequestId,
          },
        },
        relations: ['result', 'pullRequest'],
        order: {
          createdAt: 'DESC',
        },
      });

    return reviews.map(
      (review: PullRequestReviewJob): ReviewResultsResponseDto => ({
        runId: review.runId,
        provider: review.providerType,
        pullRequestId: review.pullRequest.id,
        reviewStatus: review.status,
        totalInputTokens: review.result?.totalInputTokens,
        totalOutputTokens: review.result?.totalOutputTokens,
        totalTokens: review.result?.totalTokens,
        summary: review.result?.summary || '',
        headSha: review.headSha,
        baseSha: review.baseSha,
        comments:
          review.result?.comments?.map(
            (comment: Record<string, any>): ReviewCommentResponseDto => ({
              filePath: comment.filePath as string,
              startLine: comment.startLine as number,
              endLine: comment.endLine as number,
              severity: comment.severity as string,
              category: comment.category as string,
              message: comment.message as string,
            }),
          ) || [],
      }),
    );
  }

  async findAll(
    query: PullRequestQueryRequestDto,
  ): Promise<PaginatedResponseDto<PullRequestListItemDto>> {
    const { page, limit, repositoryId, state, author, search } = query;

    const qb = this.pullRequestRepository
      .createQueryBuilder('pr')
      .leftJoin('pr.repository', 'repository');

    if (repositoryId) {
      qb.andWhere('repository.id = :repositoryId', {
        repositoryId,
      });
    }

    if (state) {
      qb.andWhere('pr.state = :state', {
        state,
      });
    }

    if (author) {
      qb.andWhere('LOWER(pr.author) LIKE LOWER(:author)', {
        author: `%${author}%`,
      });
    }

    if (search) {
      qb.andWhere('(LOWER(pr.title) LIKE LOWER(:search))', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('pr.createdAt', 'DESC');

    qb.skip((page - 1) * limit);

    qb.take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => PullRequestQueryMapper.toListItemDto(item)),

      ...PaginationUtil.buildPagination(total, page, limit),
    };
  }

  async findById(id: string): Promise<PullRequestDetailsDto> {
    const pullRequest = await this.pullRequestRepository.findOne({
      where: {
        id,
      },
    });

    if (!pullRequest) {
      return new PullRequestDetailsDto();
    }

    return PullRequestQueryMapper.toDetailDto(pullRequest);
  }

  async findPullRequestByIdWithRepositoryAndInstallation(
    id: string,
  ): Promise<PullRequest | null> {
    const pullRequest = await this.pullRequestRepository.findOne({
      where: {
        id,
      },
      relations: ['repository', 'repository.installation'],
    });

    return pullRequest;
  }

  async syncPullRequest(pullRequestId: string): Promise<PullRequestDetailsDto> {
    const pullRequest =
      await this.findPullRequestByIdWithRepositoryAndInstallation(
        pullRequestId,
      );

    if (pullRequest === null) {
      throw new AppException(
        ExceptionCodes.PULL_REQUEST_NOT_FOUND,
        'Pull request not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedPullRequest =
      await this.pullRequestSyncService.syncPullRequest(
        pullRequest?.repository,
        pullRequest?.prNumber,
      );

    return PullRequestQueryMapper.toDetailDto(updatedPullRequest);
  }
}
