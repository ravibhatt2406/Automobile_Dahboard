import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateFinanceApplicationDto } from './dto/create-finance-application.dto';
import { GenerateEmiScheduleDto } from './dto/generate-emi-schedule.dto';
import { RecordEmiPaymentDto } from './dto/record-emi-payment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FinanceStatus } from '@prisma/client';

@ApiTags('Finance & EMI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard/stats')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'FINANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'Get finance dashboard metrics and aggregate KPIs' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  getDashboardStats(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.financeService.getDashboardStats(user, branchId, franchiseId);
  }

  @Post('applications')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Submit finance application' })
  create(
    @Body() dto: CreateFinanceApplicationDto,
    @CurrentUser('id') actorUserId: string,
    @CurrentUser() user?: any,
  ) {
    return this.financeService.create(dto, actorUserId, user);
  }

  @Get('applications')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'FINANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'List finance applications' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: FinanceStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('customerId') customerId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: FinanceStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    return this.financeService.findAll(
      customerId,
      status,
      limit ? +limit : 50,
      offset ? +offset : 0,
      user,
      branchId,
      franchiseId,
      vehicleId,
    );
  }

  @Get('emi/overdue')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'FINANCE_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'List overdue EMI installments with overdue amount and days' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getOverdueEmis(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('limit') limit = 50,
    @CurrentUser() user?: any,
  ) {
    return this.financeService.getOverdueEmis(branchId, franchiseId, +limit, user);
  }

  @Get('applications/:id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'FINANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'Get finance application details with full EMI schedule and summary' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.financeService.findOne(id, user);
  }

  @Patch('applications/:id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Update finance application status with validation' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: FinanceStatus,
    @Body('remarks') remarks: string,
    @CurrentUser('id') actorUserId: string,
    @CurrentUser() user?: any,
  ) {
    return this.financeService.updateStatus(id, status, remarks, actorUserId, user);
  }

  @Post('applications/:id/emi-schedule')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Generate or regenerate monthly EMI repayment schedule' })
  generateEmiSchedule(
    @Param('id') id: string,
    @Body() dto: GenerateEmiScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.generateEmiSchedule(id, dto, user);
  }

  @Post('emi/:scheduleId/payment')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Record verified EMI collection installment (distinct from dealership revenue)' })
  recordEmiPayment(
    @Param('scheduleId') scheduleId: string,
    @Body() dto: RecordEmiPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.recordEmiPayment(scheduleId, dto, user);
  }

  @Get('applications/:id/history')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'FINANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'Get finance application audit history' })
  getHistory(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.financeService.getHistory(id, user);
  }

  @Post('applications/:id/documents')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Attach supporting loan agreement or proof' })
  attachDocument(
    @Param('id') id: string,
    @Body() fileDto: any,
    @CurrentUser('id') actorUserId: string,
    @CurrentUser() user?: any,
  ) {
    return this.financeService.attachDocument(id, fileDto, actorUserId, user);
  }
}
