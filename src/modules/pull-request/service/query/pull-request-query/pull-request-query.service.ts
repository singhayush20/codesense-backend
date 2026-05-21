import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../../../../dtos/paginated-response.dto';
import { PaginationUtil } from '../../../../../utils/pagination.utils';
import { PullRequestListItemDto } from '../../../dto/query/pull-request-list-item.dto';
import { PullRequest } from '../../../entity/pull-request.entity';
import { PullRequestQueryMapper } from '../../../mapper/pull-request-query.mapper';
import { PullRequestQueryRequestDto } from '../../../dto/query/pull-request-query-request.dto';
import { PullRequestDetailsDto } from '../../../dto/query/pull-request-details.dto';

@Injectable()
export class PullRequestQueryService {
  constructor(
    @InjectRepository(PullRequest)
    private readonly pullRequestRepository: Repository<PullRequest>,
  ) {}

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
}
