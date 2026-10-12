import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { AuditService } from '../audit/audit.service';
import { InsuranceStatus } from '@prisma/client';

@Injectable()
export class InsuranceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateInsurancePolicyDto, actorUserId: string) {
    const policyNumber = dto.policyNumber || `POL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const existing = await this.prisma.insurancePolicy.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existing) {
      throw new ConflictException(`Insurance policy already exists for Booking ID '${dto.bookingId}'`);
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException(`Booking ID '${dto.bookingId}' not found`);

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
      include: { customer: true, booking: true },
    });

    await this.auditService.log({
      actorUserId,
      action: 'INSURANCE_POLICY_CREATED',
      entityType: 'InsurancePolicy',
      entityId: policy.id,
      metadata: { policyNumber, insurer: dto.insurer, premium: dto.premium },
    }).catch(() => {});

    return policy;
  }

  async findAll(customerId?: string, status?: InsuranceStatus, limit = 50, offset = 0, user?: any) {
    const where: any = {};
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCustomer = user?.accountType === 'CUSTOMER' || (userRoles.includes('CUSTOMER') && !user?.employeeProfile);

    if (isCustomer) {
      const userCustId = user?.customerProfile?.id || user?.customerId;
      if (!userCustId) {
        return { items: [], total: 0, limit, offset };
      }
      where.customerId = userCustId;
    } else if (!isSuperAdmin) {
      if (user?.branchId) {
        where.booking = { branchId: user.branchId };
      } else if (user?.franchiseId) {
        where.booking = { branch: { franchiseId: user.franchiseId } };
      }
      if (customerId) where.customerId = customerId;
    } else {
      if (customerId) where.customerId = customerId;
    }

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

    return { items, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const policy = await this.prisma.insurancePolicy.findUnique({
      where: { id },
      include: { customer: true, booking: true },
    });

    if (!policy) throw new NotFoundException(`Insurance Policy ID '${id}' not found`);

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCustomer = user?.accountType === 'CUSTOMER' || (userRoles.includes('CUSTOMER') && !user?.employeeProfile);

      if (isCustomer) {
        const userCustId = user?.customerProfile?.id || user?.customerId;
        if (policy.customerId !== userCustId) {
          throw new ForbiddenException('Access denied to insurance policy');
        }
      }
    }

    return policy;
  }

  async updateStatus(id: string, status: InsuranceStatus, actorUserId: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.insurancePolicy.update({
      where: { id },
      data: { status },
    });

    await this.auditService.log({
      actorUserId,
      action: `INSURANCE_POLICY_${status}`,
      entityType: 'InsurancePolicy',
      entityId: id,
      metadata: { policyNumber: existing.policyNumber, status },
    }).catch(() => {});

    return updated;
  }
}
