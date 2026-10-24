import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
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

  @Get('crm')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Get CRM Pipeline & Lead Conversion Report' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getCRMReport(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.reportsService.getCRMReport(branchId, startDate, endDate, user, franchiseId);
  }

  @Get('inventory')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER')
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
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC')
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

  @Get('compliance')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR')
  @ApiOperation({ summary: 'Get Vehicle Compliance & Expiry Alert Report' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  getComplianceReport(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.reportsService.getComplianceReport(branchId, user, franchiseId);
  }

  @Get('finance')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT')
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

  @Get('export')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Export authorized filtered report data to CSV' })
  @ApiQuery({ name: 'category', required: true, enum: ['sales', 'crm', 'inventory', 'service', 'compliance', 'finance'] })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportCsv(
    @Query('category') category: 'sales' | 'crm' | 'inventory' | 'service' | 'compliance' | 'finance',
    @Res() res: Response,
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const csvContent = await this.reportsService.exportReportCsv(
      category,
      branchId,
      startDate,
      endDate,
      user,
      franchiseId,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${category}-report-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  }
}
