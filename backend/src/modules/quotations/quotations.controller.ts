import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { QuotationStatus } from '@prisma/client';

@ApiTags('Quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller(['quotations', 'sales/quotations'])
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Create quotation with backend financial calculation' })
  async create(@Body() dto: CreateQuotationDto, @CurrentUser() user: any) {
    return this.quotationsService.create(dto, user);
  }

  @Get()
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'SALES_EMPLOYEE',
    'CUSTOMER',
  )
  @ApiOperation({ summary: 'Get list of quotations (filtered by branchId, franchiseId, or status)' })
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('status') status?: QuotationStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.findAll(
      branchId,
      undefined,
      status,
      Number(limit),
      Number(offset),
      user,
      franchiseId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'SALES_EMPLOYEE',
    'CUSTOMER',
  )
  @ApiOperation({ summary: 'Get quotation details and line items' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quotationsService.findOne(id, user);
  }

  @Post(':id/approve')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Approve quotation (Self-approval prevented for non-admins)' })
  async approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quotationsService.approve(id, user);
  }

  @Post(':id/reject')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Reject quotation' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.quotationsService.reject(id, reason || 'Discounts or terms not approved', user);
  }
}
