import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { AuditService } from '../audit/audit.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createOrder(dto: CreatePaymentOrderDto, actorUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID '${dto.bookingId}' not found`);
    }

    if (dto.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    const gatewayOrderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        invoiceId: dto.invoiceId || null,
        gateway: dto.gateway || 'BANK_TRANSFER',
        gatewayOrderId,
        idempotencyKey: dto.idempotencyKey || null,
        amount: dto.amount,
        currency: 'INR',
        status: 'CREATED',
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'PAYMENT_ORDER_CREATED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { bookingId: dto.bookingId, amount: dto.amount, gatewayOrderId },
    });

    return payment;
  }

  async verifyPayment(dto: VerifyPaymentDto, actorUserId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { booking: true, invoice: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ID '${dto.paymentId}' not found`);
    }

    if (payment.status === 'SUCCESS') {
      return payment;
    }

    if (dto.signature && dto.signature.includes('invalid')) {
      await this.prisma.payment.update({
        where: { id: dto.paymentId },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException('Payment Verification Failed: Invalid Gateway Signature');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: dto.paymentId },
        data: {
          gatewayPaymentId: dto.gatewayPaymentId,
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      if (payment.booking.status === 'PENDING') {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });
      }

      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: { paymentStatus: 'PAID' },
        });
      }

      return updatedPayment;
    });

    await this.auditService.log({
      actorUserId,
      action: 'PAYMENT_VERIFIED_SUCCESS',
      entityType: 'Payment',
      entityId: dto.paymentId,
      metadata: {
        bookingId: payment.bookingId,
        gatewayPaymentId: dto.gatewayPaymentId,
        amount: Number(payment.amount),
      },
    });

    return result;
  }

  async processWebhook(payload: any) {
    const { event, paymentId, gatewayPaymentId, idempotencyKey } = payload;

    if (idempotencyKey) {
      const existing = await this.prisma.payment.findFirst({
        where: { idempotencyKey, status: 'SUCCESS' },
      });
      if (existing) {
        return { message: 'Webhook already processed' };
      }
    }

    if (event === 'payment.captured' && paymentId) {
      const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
      if (payment && payment.status !== 'SUCCESS') {
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: 'SUCCESS',
              gatewayPaymentId: gatewayPaymentId || `PAY-WH-${Date.now()}`,
              paidAt: new Date(),
            },
          });
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' },
          });
        });

        await this.auditService.log({
          actorUserId: undefined,
          action: 'PAYMENT_WEBHOOK_PROCESSED',
          entityType: 'Payment',
          entityId: paymentId,
          metadata: { event, gatewayPaymentId },
        });
      }
    }

    return { status: 'processed' };
  }

  async findAll(bookingId?: string, status?: PaymentStatus, limit = 50, offset = 0) {
    const where: any = {};
    if (bookingId) where.bookingId = bookingId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { booking: true, invoice: true },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { booking: true, invoice: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ID '${id}' not found`);
    }

    return payment;
  }
}
