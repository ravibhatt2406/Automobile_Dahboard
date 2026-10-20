import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { CreateComplianceDocDto } from './dto/create-compliance-doc.dto';
import { UpdateComplianceDocDto } from './dto/update-compliance-doc.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ComplianceDocType, ComplianceDocStatus } from '@prisma/client';

@ApiTags('Vehicle Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Register a vehicle compliance document (PUC, Insurance, Fitness, Permit, RC, Road Tax)' })
  create(@Body() dto: CreateComplianceDocDto, @CurrentUser() user: any) {
    return this.complianceService.create(dto, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE', 'MECHANIC', 'CUSTOMER')
  @ApiOperation({ summary: 'List compliance documents with scoping and filters' })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'documentType', required: false, enum: ComplianceDocType })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'expiryBefore', required: false })
  @ApiQuery({ name: 'expiryAfter', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('documentType') documentType?: ComplianceDocType,
    @Query('status') status?: ComplianceDocStatus,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('expiryBefore') expiryBefore?: string,
    @Query('expiryAfter') expiryAfter?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    return this.complianceService.findAll(user, {
      vehicleId,
      documentType,
      status,
      search,
      branchId,
      franchiseId,
      expiryBefore,
      expiryAfter,
      limit,
      offset,
    });
  }

  @Get('summary')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Get summary metrics of vehicle compliance' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  getSummary(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.complianceService.getSummary(user, branchId, franchiseId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Get compliance document details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.complianceService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'CUSTOMER')
  @ApiOperation({ summary: 'Update compliance document' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateComplianceDocDto,
    @CurrentUser() user: any,
  ) {
    return this.complianceService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Delete compliance document' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.complianceService.remove(id, user);
  }
}
