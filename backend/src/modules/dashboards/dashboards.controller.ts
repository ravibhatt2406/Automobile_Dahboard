import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('api/v1/dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('super-admin')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Super Admin Overview Dashboard' })
  getSuperAdminDashboard() {
    return this.dashboardsService.getSuperAdminDashboard();
  }

  @Get('branch-manager')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Branch Manager Operational Dashboard' })
  getBranchManagerDashboard(@Query('branchId') branchId: string) {
    return this.dashboardsService.getBranchManagerDashboard(branchId);
  }

  @Get('sales')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Sales Executive Workload Dashboard' })
  getSalesDashboard(@CurrentUser('employeeId') employeeId: string) {
    return this.dashboardsService.getSalesDashboard(employeeId);
  }

  @Get('mechanic')
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Mechanic Workstation & Active Job Dashboard' })
  getMechanicDashboard(@CurrentUser('employeeId') mechanicEmployeeId: string) {
    return this.dashboardsService.getMechanicDashboard(mechanicEmployeeId);
  }

  @Get('customer')
  @Roles('CUSTOMER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Customer Portal Dashboard' })
  getCustomerDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardsService.getCustomerDashboard(userId);
  }
}
