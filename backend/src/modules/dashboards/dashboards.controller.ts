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
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('super-admin')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Super Admin Overview Dashboard' })
  getSuperAdminDashboard() {
    return this.dashboardsService.getSuperAdminDashboard();
  }

  @Get('franchise')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER')
  @ApiOperation({ summary: 'Franchise Executive Dashboard' })
  getFranchiseDashboard(
    @Query('franchiseId') queryFranchiseId: string,
    @CurrentUser() user: any,
  ) {
    return this.dashboardsService.getFranchiseDashboard(queryFranchiseId, user);
  }

  @Get('organization')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER')
  @ApiOperation({ summary: 'Organization / Franchise Dashboard Alias' })
  getOrganizationDashboard(
    @Query('franchiseId') queryFranchiseId: string,
    @CurrentUser() user: any,
  ) {
    return this.dashboardsService.getFranchiseDashboard(queryFranchiseId, user);
  }

  @Get('branch')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Branch Operational Dashboard' })
  getBranchDashboard(
    @Query('branchId') queryBranchId: string,
    @CurrentUser() user: any,
  ) {
    return this.dashboardsService.getBranchDashboard(queryBranchId, user);
  }

  @Get('branch-manager')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Branch Manager Operational Dashboard Alias' })
  getBranchManagerDashboard(
    @Query('branchId') queryBranchId: string,
    @CurrentUser() user: any,
  ) {
    return this.dashboardsService.getBranchDashboard(queryBranchId, user);
  }

  @Get('sales')
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'SALES_EMPLOYEE',
  )
  @ApiOperation({ summary: 'Sales Executive Workload Dashboard' })
  getSalesDashboard(@CurrentUser() user: any) {
    return this.dashboardsService.getSalesDashboard(user);
  }

  @Get('service-advisor')
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'SERVICE_ADVISOR',
  )
  @ApiOperation({ summary: 'Service Advisor Operations Dashboard' })
  getServiceAdvisorDashboard(@CurrentUser() user: any) {
    return this.dashboardsService.getServiceAdvisorDashboard(user);
  }

  @Get('mechanic')
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC')
  @ApiOperation({ summary: 'Mechanic Workstation & Active Job Dashboard' })
  getMechanicDashboard(@CurrentUser() user: any) {
    const mechanicEmployeeId = user?.employeeId || user?.employeeProfile?.id || user?.id;
    return this.dashboardsService.getMechanicDashboard(mechanicEmployeeId);
  }

  @Get('customer')
  @Roles('CUSTOMER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Customer Portal Dashboard' })
  getCustomerDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardsService.getCustomerDashboard(userId);
  }
}
