import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { AuditService } from '../audit/audit.service';
import { PaymentStatus } from '@prisma/client';
import { DevelopmentPaymentProvider } from './providers/development-payment.provider';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private paymentProvider: DevelopmentPaymentProvider,
  ) {}

  async createOrder(dto: CreatePaymentOrderDto, user: any) {
    const actorUserId = user?.id;
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCustomer = userRoles.includes('CUSTOMER');

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { branch: true },
    });
    if (!booking) throw new NotFoundException(`Booking ID '${dto.bookingId}' not found`);

    if (isCustomer) {
      if (user.customerId && booking.customerId !== user.customerId) {
        throw new ForbiddenException('Cannot create payment order for another customer booking');
      }
    } else if (!isSuperAdmin) {
      if (user?.branchId && booking.branchId !== user.branchId) {
        throw new ForbiddenException('Cannot create payment order for another branch');
      }
      if (user?.franchiseId && booking.branch?.franchiseId !== user.franchiseId) {
        throw new ForbiddenException('Cannot create payment order for another franchise');
      }
    }

    // Server-side amount validation against database booking & payment records
    if (!dto.amount || Number(dto.amount) <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const successfulPayments = await this.prisma.payment.aggregate({
      where: {
        bookingId: booking.id,
        status: 'SUCCESS',
      },
      _sum: { amount: true },
    });
    const totalPaid = Number(successfulPayments._sum.amount || 0);
    const bookingTotal = Number(booking.totalAmount);
    const remainingBalance = Math.max(0, bookingTotal - totalPaid);

    if (remainingBalance <= 0) {
      throw new BadRequestException('Booking is already fully paid');
    }

    if (dto.amount > remainingBalance) {
      throw new BadRequestException(
        `Payment amount (₹${dto.amount}) cannot exceed remaining booking balance of ₹${remainingBalance}`,
      );
    }

    // Invoice relation validation
    if (dto.invoiceId) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice ID '${dto.invoiceId}' not found`);
      }
      if (invoice.bookingId && invoice.bookingId !== booking.id) {
        throw new BadRequestException('Specified invoice does not belong to this booking');
      }
      if (invoice.customerId !== booking.customerId) {
        throw new BadRequestException('Invoice customer mismatch with booking customer');
      }
      if (dto.amount > Number(invoice.totalAmount)) {
        throw new BadRequestException(
          `Payment amount cannot exceed invoice amount of ₹${invoice.totalAmount}`,
        );
      }
    }

    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }

    // Provider order creation (server-side provider abstraction)
    const providerOrder = await this.paymentProvider.createOrder({
      orderId: dto.bookingId,
      amount: dto.amount,
      currency: 'INR',
    });
    const gatewayOrderId = providerOrder.gatewayOrderId;

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        invoiceId: dto.invoiceId || null,
        gateway: dto.gateway || this.paymentProvider.providerName,
        gatewayOrderId,
        idempotencyKey: dto.idempotencyKey || null,
        amount: dto.amount,
        currency: 'INR',
        status: 'CREATED',
      },
    });

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'PAYMENT_ORDER_CREATED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { bookingId: dto.bookingId, amount: dto.amount, gatewayOrderId, isDevelopmentOnly: this.paymentProvider.isDevelopmentOnly },
    }).catch(() => {});

    return payment;
  }

  async verifyPayment(dto: VerifyPaymentDto, user: any) {
    const actorUserId = user?.id;
    const payment = await this.findOne(dto.paymentId, user);

    if (payment.status === 'SUCCESS') {
      return payment; // Already successfully verified
    }

    // Server-side cryptographic payment verification via provider abstraction
    const verification = await this.paymentProvider.verifySignature({
      gatewayOrderId: payment.gatewayOrderId || '',
      gatewayPaymentId: dto.gatewayPaymentId,
      signature: dto.signature,
      expectedAmount: Number(payment.amount),
    });

    if (!verification.verified) {
      await this.prisma.payment.update({
        where: { id: dto.paymentId },
        data: { status: 'FAILED' },
      }).catch(() => {});
      throw new BadRequestException(
        `Payment Verification Failed: ${verification.errorMessage || 'Invalid Gateway Signature'}`,
      );
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

      if (payment.bookingId) {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        }).catch(() => {});
      }

      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: { paymentStatus: 'PAID' },
        }).catch(() => {});
      }

      return updatedPayment;
    });

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'PAYMENT_VERIFIED_SUCCESS',
      entityType: 'Payment',
      entityId: dto.paymentId,
      metadata: {
        bookingId: payment.bookingId,
        gatewayPaymentId: dto.gatewayPaymentId,
        amount: Number(payment.amount),
      },
    }).catch(() => {});

    return result;
  }

  async processWebhook(payload: any, signatureOrSecret?: string) {
    const webhookSecret =
      process.env.PAYMENT_WEBHOOK_SECRET ||
      process.env.PAYMENT_GATEWAY_SECRET ||
      'dev-titan-auto-secure-payment-secret-key-2026';

    // In production or when webhook secret is explicitly configured, enforce signature check
    if (process.env.NODE_ENV === 'production' || process.env.PAYMENT_WEBHOOK_SECRET) {
      if (!signatureOrSecret) {
        throw new ForbiddenException('Missing payment gateway webhook signature or secret header');
      }
      const directSecretMatch = signatureOrSecret === webhookSecret;
      let hmacMatch = false;
      try {
        const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const expectedHmac = crypto
          .createHmac('sha256', webhookSecret)
          .update(payloadString)
          .digest('hex');
        hmacMatch =
          signatureOrSecret.length === expectedHmac.length &&
          crypto.timingSafeEqual(Buffer.from(signatureOrSecret), Buffer.from(expectedHmac));
      } catch {
        hmacMatch = false;
      }

      if (!directSecretMatch && !hmacMatch) {
        throw new ForbiddenException('Invalid payment gateway webhook signature verification');
      }
    }

    const { event, paymentId, gatewayPaymentId, idempotencyKey } = payload || {};

    if (idempotencyKey) {
      const existing = await this.prisma.payment.findFirst({
        where: { idempotencyKey, status: 'SUCCESS' },
      });
      if (existing) return { message: 'Webhook already processed' };
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
        }).catch(() => {});
      }
    }

    return { status: 'processed' };
  }

  async findAll(bookingId?: string, status?: PaymentStatus, limit = 50, offset = 0, user?: any) {
    const where: any = {};
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCustomer = userRoles.includes('CUSTOMER');

    if (isCustomer) {
      if (!user?.customerId) {
        return { items: [], total: 0, limit, offset };
      }
      where.booking = { customerId: user.customerId };
    } else if (!isSuperAdmin) {
      if (user?.branchId) {
        where.booking = { branchId: user.branchId };
      } else if (user?.franchiseId) {
        where.booking = { branch: { franchiseId: user.franchiseId } };
      }
    }

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

  async findOne(id: string, user?: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { booking: { include: { branch: true } }, invoice: true },
    });

    if (!payment) throw new NotFoundException(`Payment ID '${id}' not found`);

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCustomer = userRoles.includes('CUSTOMER');

      if (isCustomer) {
        if (!user.customerId || payment.booking?.customerId !== user.customerId) {
          throw new ForbiddenException('Access denied to payment');
        }
      } else if (!isSuperAdmin) {
        if (user.branchId && payment.booking?.branchId !== user.branchId) {
          throw new ForbiddenException('Access denied to payment in another branch');
        }
        if (user.franchiseId && payment.booking?.branch?.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Access denied to payment in another franchise');
        }
      }
    }

    return payment;
  }
}
