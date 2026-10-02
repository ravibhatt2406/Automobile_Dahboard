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
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PaymentStatus } from '@prisma/client';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Create payment order for booking' })
  createOrder(@Body() dto: CreatePaymentOrderDto, @CurrentUser('id') actorUserId: string) {
    return this.paymentsService.createOrder(dto, actorUserId);
  }

  @Post('verify')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Server-side payment verification' })
  verifyPayment(@Body() dto: VerifyPaymentDto, @CurrentUser('id') actorUserId: string) {
    return this.paymentsService.verifyPayment(dto, actorUserId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Payment Gateway Webhook Endpoint' })
  webhook(@Body() payload: any) {
    return this.paymentsService.processWebhook(payload);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'ACCOUNTANT')
  @ApiOperation({ summary: 'List payments' })
  @ApiQuery({ name: 'bookingId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('bookingId') bookingId?: string,
    @Query('status') status?: PaymentStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentsService.findAll(bookingId, status, limit ? +limit : 50, offset ? +offset : 0);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get payment details' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
