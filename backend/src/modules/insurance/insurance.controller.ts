import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { InsuranceStatus } from '@prisma/client';

@ApiTags('Insurance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('api/v1/insurance/policies')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER')
  @ApiOperation({ summary: 'Create insurance policy' })
  create(@Body() dto: CreateInsurancePolicyDto, @CurrentUser('id') actorUserId: string) {
    return this.insuranceService.create(dto, actorUserId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER')
  @ApiOperation({ summary: 'List insurance policies' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InsuranceStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: InsuranceStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.insuranceService.findAll(customerId, status, limit ? +limit : 50, offset ? +offset : 0);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER')
  @ApiOperation({ summary: 'Get insurance policy details' })
  findOne(@Param('id') id: string) {
    return this.insuranceService.findOne(id);
  }
}
