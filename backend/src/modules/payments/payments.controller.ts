import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
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
import { Public } from '@/common/decorators/public.decorator';
import { PaymentStatus } from '@prisma/client';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Create payment order for booking' })
  createOrder(@Body() dto: CreatePaymentOrderDto, @CurrentUser() user: any) {
    return this.paymentsService.createOrder(dto, user);
  }

  @Post('verify')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Server-side payment verification' })
  verifyPayment(@Body() dto: VerifyPaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.verifyPayment(dto, user);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Payment Gateway Webhook Endpoint' })
  webhook(
    @Body() payload: any,
    @Headers('x-webhook-signature') signature?: string,
    @Headers('x-webhook-secret') secret?: string,
  ) {
    return this.paymentsService.processWebhook(payload, signature || secret);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'ACCOUNTANT', 'CUSTOMER')
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
    @CurrentUser() user?: any,
  ) {
    return this.paymentsService.findAll(bookingId, status, limit ? +limit : 50, offset ? +offset : 0, user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'ACCOUNTANT', 'CUSTOMER')
  @ApiOperation({ summary: 'Get payment details' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.paymentsService.findOne(id, user);
  }
}
