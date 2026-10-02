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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('api/v1/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Issue GST Invoice' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser('id') actorUserId: string) {
    return this.invoicesService.create(dto, actorUserId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'List invoices' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.invoicesService.findAll(branchId, status, limit ? +limit : 50, offset ? +offset : 0);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Get invoice details' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get(':id/pdf')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Get PDF invoice data payload' })
  getPdf(@Param('id') id: string) {
    return this.invoicesService.generatePdfData(id);
  }

  @Patch(':id/cancel')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Cancel issued invoice' })
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.invoicesService.cancel(id, reason, actorUserId);
  }
}
