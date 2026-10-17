import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get Sales Performance & Conversion Report' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getSalesReport(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.reportsService.getSalesReport(branchId, startDate, endDate, user, franchiseId);
  }

  @Get('inventory')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Get Inventory Stock & Valuation Report' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  getInventoryReport(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.reportsService.getInventoryReport(branchId, user, franchiseId);
  }

  @Get('service')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR')
  @ApiOperation({ summary: 'Get Service Operations & Workload Report' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getServiceReport(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.reportsService.getServiceReport(branchId, startDate, endDate, user, franchiseId);
  }

  @Get('finance')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Finance & Collections Report' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getFinanceReport(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.reportsService.getFinanceReport(branchId, startDate, endDate, user, franchiseId);
  }
}
