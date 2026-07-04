import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PullRequestFileQueryService } from '../../service/query/pull-request-file-query/pull-request-file-query.service';
import { PullRequestQueryService } from '../../service/query/pull-request-query/pull-request-query.service';
import { PullRequestQueryRequestDto } from '../../dto/query/pull-request-query-request.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { RoleTypes } from '../../../user/enums/role-types.enums';
import { Roles } from '../../../auth/decorator/roles.decorator';
import { PaginatedResponseDto } from '../../../../dtos/paginated-response.dto';
import { PullRequestListItemDto } from '../../dto/query/pull-request-list-item.dto';
import { PullRequestDetailsDto } from '../../dto/query/pull-request-details.dto';
import { PullRequestFileContentDto } from '../../dto/query/pull-request-file-content.dto';
import { PullRequestFileListDto } from '../../dto/query/pull-request-file-list.dto';
import { ReviewResultsResponseDto } from '../../dto/review/pr-review-comment.dto';

@Controller('pull-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class PullRequestQueryController {
  constructor(
    private readonly pullRequestQueryService: PullRequestQueryService,
    private readonly pullRequestFileQueryService: PullRequestFileQueryService,
  ) {}

  @Get()
  @Roles(RoleTypes.ROLE_USER, RoleTypes.ROLE_ADMIN)
  async findAll(
    @Query()
    query: PullRequestQueryRequestDto,
  ): Promise<PaginatedResponseDto<PullRequestListItemDto>> {
    return this.pullRequestQueryService.findAll(query);
  }

  @Get(':id')
  @Roles(RoleTypes.ROLE_USER, RoleTypes.ROLE_ADMIN)
  async findById(
    @Param('id')
    id: string,
  ): Promise<PullRequestDetailsDto> {
    return this.pullRequestQueryService.findById(id);
  }

  @Get(':id/files')
  @Roles(RoleTypes.ROLE_USER, RoleTypes.ROLE_ADMIN)
  async findFiles(
    @Param('id')
    id: string,
  ): Promise<PullRequestFileListDto> {
    return this.pullRequestFileQueryService.findFilesByPullRequestId(id);
  }

  @Get('files/:fileId/content')
  @Roles(RoleTypes.ROLE_USER, RoleTypes.ROLE_ADMIN)
  async findFileContent(
    @Param('fileId')
    fileId: string,
  ): Promise<PullRequestFileContentDto> {
    return this.pullRequestFileQueryService.findFileContent(fileId);
  }

  @Get(':id/reviews')
  @Roles(RoleTypes.ROLE_ADMIN, RoleTypes.ROLE_USER)
  async getReviewsForPullRequest(
    @Param('id') pullRequestId: string,
  ): Promise<ReviewResultsResponseDto[]> {
    return await this.pullRequestQueryService.getReviewsForPullRequest(
      pullRequestId,
    );
  }

  @Get(':id/sync')
  @Roles(RoleTypes.ROLE_ADMIN, RoleTypes.ROLE_USER)
  async syncPullRequest(
    @Param('id') pullRequestId: string,
  ): Promise<PullRequestDetailsDto> {
    return await this.pullRequestQueryService.syncPullRequest(pullRequestId);
  }
}
