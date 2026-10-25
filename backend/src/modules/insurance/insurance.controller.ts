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
import { InsuranceService } from './insurance.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { UpdateInsurancePolicyDto } from './dto/update-insurance-policy.dto';
import { RenewInsurancePolicyDto } from './dto/renew-insurance-policy.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { InsuranceStatus } from '@prisma/client';

@ApiTags('Insurance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller(['insurance/policies', 'insurance'])
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get('stats')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'Get insurance dashboard KPI metrics' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  getStats(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.insuranceService.getDashboardStats(user, branchId, franchiseId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER')
  @ApiOperation({ summary: 'Create insurance policy' })
  create(
    @Body() dto: CreateInsurancePolicyDto,
    @CurrentUser('id') actorUserId: string,
    @CurrentUser() user?: any,
  ) {
    return this.insuranceService.create(dto, actorUserId, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'List insurance policies with filtering & search' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InsuranceStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('search') search?: string,
    @Query('status') status?: InsuranceStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    return this.insuranceService.findAll(
      customerId,
      status,
      limit ? +limit : 50,
      offset ? +offset : 0,
      user,
      branchId,
      franchiseId,
      search,
      vehicleId,
    );
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'Get insurance policy details' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.insuranceService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER')
  @ApiOperation({ summary: 'Update insurance policy permitted fields' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInsurancePolicyDto,
    @CurrentUser('id') actorUserId: string,
    @CurrentUser() user?: any,
  ) {
    return this.insuranceService.update(id, dto, actorUserId, user);
  }

  @Post(':id/renew')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER')
  @ApiOperation({ summary: 'Record policy renewal information' })
  renew(
    @Param('id') id: string,
    @Body() dto: RenewInsurancePolicyDto,
    @CurrentUser('id') actorUserId: string,
    @CurrentUser() user?: any,
  ) {
    return this.insuranceService.renew(id, dto, actorUserId, user);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'INSURANCE_MANAGER')
  @ApiOperation({ summary: 'Update insurance policy status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: InsuranceStatus,
    @CurrentUser('id') actorUserId: string,
    @CurrentUser() user?: any,
  ) {
    return this.insuranceService.updateStatus(id, status, actorUserId, user);
  }

  @Get(':id/history')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'Get policy history and audit logs' })
  getHistory(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.insuranceService.getHistory(id, user);
  }

  @Post(':id/documents')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER')
  @ApiOperation({ summary: 'Attach supporting document to insurance policy' })
  attachDocument(
    @Param('id') id: string,
    @Body() fileDto: any,
    @CurrentUser('id') actorUserId: string,
    @CurrentUser() user?: any,
  ) {
    return this.insuranceService.attachDocument(id, fileDto, actorUserId, user);
  }
}
