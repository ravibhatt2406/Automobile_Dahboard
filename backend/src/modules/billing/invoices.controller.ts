import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Header,
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
@Controller(['invoices', 'billing/invoices'])
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Issue GST Invoice' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: any) {
    return this.invoicesService.create(dto, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'List invoices' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    return this.invoicesService.findAll(
      branchId,
      status,
      limit ? +limit : 50,
      offset ? +offset : 0,
      user,
      franchiseId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Get invoice details' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.invoicesService.findOne(id, user);
  }

  @Get(':id/pdf')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Get PDF invoice data payload' })
  getPdf(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.invoicesService.generatePdfData(id, user);
  }

  @Get(':id/pdf/download')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT', 'SALES_EMPLOYEE', 'CUSTOMER')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Printable HTML invoice statement' })
  async downloadPdf(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.invoicesService.renderPrintableHtml(id, user);
  }

  @Post(':id/payments')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Record verified payment on invoice' })
  recordPayment(
    @Param('id') id: string,
    @Body() dto: { amount: number; paymentMethod?: string; transactionReference?: string },
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.recordPayment(id, dto, user);
  }

  @Patch(':id/cancel')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Cancel issued invoice' })
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.cancel(id, reason, user);
  }
}
