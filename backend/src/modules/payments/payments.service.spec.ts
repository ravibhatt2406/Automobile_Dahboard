import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DevelopmentPaymentProvider } from './providers/development-payment.provider';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('PaymentsService - Phase 7 Security Hardening', () => {
  let service: PaymentsService;
  let prisma: any;
  let auditService: any;
  let paymentProvider: any;

  beforeEach(async () => {
    prisma = {
      booking: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      invoice: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(true),
    };

    paymentProvider = {
      providerName: 'DEVELOPMENT_SANDBOX_GATEWAY',
      isDevelopmentOnly: true,
      createOrder: jest.fn().mockResolvedValue({ gatewayOrderId: 'GW_ORD_123' }),
      verifySignature: jest.fn().mockResolvedValue({ verified: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: DevelopmentPaymentProvider, useValue: paymentProvider },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createOrder amount tampering protection', () => {
    const mockUser = { id: 'usr-1', roles: ['CUSTOMER'], customerId: 'cust-1' };
    const mockBooking = {
      id: 'bk-1',
      customerId: 'cust-1',
      branchId: 'br-1',
      bookingAmount: 50000,
      totalAmount: 1000000,
      status: 'PENDING',
      branch: { id: 'br-1', franchiseId: 'fr-1' },
    };

    it('should reject payment if amount is zero or negative', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.createOrder({ bookingId: 'bk-1', amount: 0 }, mockUser),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createOrder({ bookingId: 'bk-1', amount: -500 }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payment if amount exceeds remaining balance', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 800000 },
      });

      // Remaining balance is 200,000, but client requests 300,000
      await expect(
        service.createOrder({ bookingId: 'bk-1', amount: 300000 }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payment if booking is already fully paid', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 1000000 },
      });

      await expect(
        service.createOrder({ bookingId: 'bk-1', amount: 1000 }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payment if invoice does not belong to booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-other',
        bookingId: 'bk-OTHER',
        customerId: 'cust-1',
        totalAmount: 50000,
      });

      await expect(
        service.createOrder({ bookingId: 'bk-1', invoiceId: 'inv-other', amount: 50000 }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid order within balance and return created payment', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prisma.payment.create.mockResolvedValue({
        id: 'pay-1',
        bookingId: 'bk-1',
        amount: 50000,
        status: 'CREATED',
        gatewayOrderId: 'GW_ORD_123',
      });

      const result = await service.createOrder(
        { bookingId: 'bk-1', amount: 50000 },
        mockUser,
      );

      expect(result.id).toBe('pay-1');
      expect(result.status).toBe('CREATED');
      expect(paymentProvider.createOrder).toHaveBeenCalledWith({
        orderId: 'bk-1',
        amount: 50000,
        currency: 'INR',
      });
    });
  });

  describe('processWebhook security verification', () => {
    it('should reject webhook in production when signature is missing', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        await expect(
          service.processWebhook({ event: 'payment.captured', paymentId: 'pay-1' }, undefined),
        ).rejects.toThrow(ForbiddenException);
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });

    it('should reject webhook when signature or secret does not match', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        await expect(
          service.processWebhook(
            { event: 'payment.captured', paymentId: 'pay-1' },
            'invalid_unauthorized_token',
          ),
        ).rejects.toThrow(ForbiddenException);
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });
  });
});
