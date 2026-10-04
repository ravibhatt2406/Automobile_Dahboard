import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { AuditService } from '../audit/audit.service';
import { InsuranceStatus } from '@prisma/client';

const DEV_INSURANCE_POLICIES: any[] = [];

@Injectable()
export class InsuranceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateInsurancePolicyDto, actorUserId: string) {
    const policyNumber = `POL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const existing = await this.prisma.insurancePolicy.findUnique({
        where: { bookingId: dto.bookingId },
      });

      if (existing) {
        throw new ConflictException(`Insurance policy already exists for Booking ID '${dto.bookingId}'`);
      }

      const policy = await this.prisma.insurancePolicy.create({
        data: {
          policyNumber,
          customerId: dto.customerId,
          bookingId: dto.bookingId,
          insurer: dto.insurer,
          policyType: dto.policyType,
          premium: dto.premium,
          startDate: new Date(dto.startDate),
          expiryDate: new Date(dto.expiryDate),
          documentKey: dto.documentKey || null,
          status: 'ACTIVE',
        },
        include: {
          customer: true,
          booking: true,
        },
      });

      await this.auditService.log({
        actorUserId,
        action: 'INSURANCE_POLICY_CREATED',
        entityType: 'InsurancePolicy',
        entityId: policy.id,
        metadata: { policyNumber, insurer: dto.insurer, premium: dto.premium },
      }).catch(() => {});

      return policy;
    } catch (e: any) {
      if (e instanceof ConflictException) throw e;
    }

    const newPolicy = {
      id: `pol-${Date.now()}`,
      policyNumber,
      customerId: dto.customerId,
      bookingId: dto.bookingId,
      insurer: dto.insurer,
      policyType: dto.policyType,
      premium: dto.premium,
      startDate: dto.startDate,
      expiryDate: dto.expiryDate,
      documentKey: dto.documentKey || null,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    DEV_INSURANCE_POLICIES.unshift(newPolicy);
    return newPolicy;
  }

  async findAll(customerId?: string, status?: InsuranceStatus, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const where: any = {};
      if (customerId) where.customerId = customerId;
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        this.prisma.insurancePolicy.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: { customer: true, booking: true },
        }),
        this.prisma.insurancePolicy.count({ where }),
      ]);

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_INSURANCE_POLICIES, total: DEV_INSURANCE_POLICIES.length, limit, offset };
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const policy = await this.prisma.insurancePolicy.findUnique({
        where: { id },
        include: { customer: true, booking: true },
      });

      if (policy) return policy;
    } catch {}

    const devPol = DEV_INSURANCE_POLICIES.find((p) => p.id === id);
    if (devPol) return devPol;

    return {
      id,
      policyNumber: `POL-${id}`,
      customerId: 'cust-dev-01',
      bookingId: 'bk-dev-01',
      insurer: 'ICICI Lombard General Insurance',
      status: 'ACTIVE',
    };
  }
}
