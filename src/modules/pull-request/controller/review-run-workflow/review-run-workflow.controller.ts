import {
  Controller,
  Get,
  MessageEvent,
  Param,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { Roles } from '../../../auth/decorator/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { RoleTypes } from '../../../user/enums/role-types.enums';
import { ReviewRunWorkflowDto } from '../../dto/review/review-workflow.dto';
import { ReviewWorkflowEventService } from '../../service/orchestration/review-workflow/review-workflow-event.service';
import { ReviewWorkflowQueryService } from '../../service/query/review-workflow-query/review-workflow-query.service';

@Controller('review-runs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class ReviewRunWorkflowController {
  constructor(
    private readonly queryService: ReviewWorkflowQueryService,
    private readonly eventService: ReviewWorkflowEventService,
  ) {}

  @Get(':runId/workflow')
  @Roles(RoleTypes.ROLE_USER, RoleTypes.ROLE_ADMIN)
  findWorkflow(@Param('runId') runId: string): Promise<ReviewRunWorkflowDto> {
    return this.queryService.findByRunId(runId);
  }

  @Sse(':runId/events')
  @Roles(RoleTypes.ROLE_USER, RoleTypes.ROLE_ADMIN)
  streamEvents(@Param('runId') runId: string): Observable<MessageEvent> {
    return this.eventService.subscribe(runId);
  }
}
