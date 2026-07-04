import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PrCodeParsingService } from '../../service/orchestration/pr-code-parsing/pr-code-parsing.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorator/roles.decorator';
import { RoleTypes } from '../../../user/enums/role-types.enums';
import { PullRequestReviewContextDto } from '../../dto/review/pr-review-context.dto';

@Controller('debug/pull-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class CodeParserController {
  constructor(private readonly prCodeParsingService: PrCodeParsingService) {}

  @Get(':pullRequestId/review-context')
  @Roles(RoleTypes.ROLE_USER, RoleTypes.ROLE_ADMIN)
  async generateReviewContext(
    @Param('pullRequestId')
    pullRequestId: string,
  ): Promise<PullRequestReviewContextDto> {
    const result =
      await this.prCodeParsingService.generateContextFromPullRequest(
        pullRequestId,
      );

    return result;
  }
}
