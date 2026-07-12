import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardStatsService } from '../service/dashboard-stats.service';
import { DashboardStatsResponseDto } from '../dto/dashboard-stats-response.dto';
import { Roles } from '../../auth/decorator/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RoleTypes } from '../enums/role-types.enums';
import * as currentUserDecorator from '../../auth/decorator/current-user.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class DashboardController {
  constructor(private readonly dashboardStatsService: DashboardStatsService) {}

  @Get('stats')
  @Roles(RoleTypes.ROLE_USER, RoleTypes.ROLE_ADMIN)
  async getStats(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtUser,
  ): Promise<DashboardStatsResponseDto> {
    return this.dashboardStatsService.getStats(user.userId);
  }
}
