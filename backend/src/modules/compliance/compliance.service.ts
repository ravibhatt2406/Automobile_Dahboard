import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateComplianceDocDto } from './dto/create-compliance-doc.dto';
import { UpdateComplianceDocDto } from './dto/update-compliance-doc.dto';
import { ComplianceDocStatus, ComplianceDocType } from '@prisma/client';
import { resolveUserScope } from '@/common/utils/scope.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private computeDocStatus(
    expiryDate?: Date | string | null,
    currentStatus?: ComplianceDocStatus,
  ): ComplianceDocStatus {
    if (currentStatus === ComplianceDocStatus.REJECTED) {
      return ComplianceDocStatus.REJECTED;
    }
    if (!expiryDate) {
      return currentStatus || ComplianceDocStatus.VALID;
    }

    const now = new Date();
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) {
      return currentStatus || ComplianceDocStatus.VALID;
    }

    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (exp < now) {
      return ComplianceDocStatus.EXPIRED;
    }
    if (exp <= thirtyDaysFromNow) {
      return ComplianceDocStatus.EXPIRING_SOON;
    }
    return ComplianceDocStatus.VALID;
  }

  private async validateVehicleAccess(vehicleId: string, user: any) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { branch: true, customer: true },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${vehicleId}' not found`);
    }

    if (!user) return vehicle;

    const scope = user.effectiveScope || (await resolveUserScope(this.prisma, user));

    if (scope.isCustomer) {
      const resolvedCustomerId =
        user?.customerId ||
        user?.customerProfile?.id ||
        (await this.prisma.customer.findFirst({ where: { userId: user.id } }))?.id;

      if (!resolvedCustomerId || vehicle.customerId !== resolvedCustomerId) {
        throw new ForbiddenException('Access denied: You can only view compliance for your registered vehicles');
      }
    } else if (!scope.isActingSuperAdmin) {
      if (scope.isActingFranchiseLevel) {
        if (vehicle.branch && vehicle.branch.franchiseId !== scope.effectiveFranchiseId) {
          throw new ForbiddenException('Access denied: Vehicle belongs to another franchise');
        }
      } else if (scope.effectiveBranchId) {
        if (vehicle.branchId && vehicle.branchId !== scope.effectiveBranchId) {
          throw new ForbiddenException('Access denied: Vehicle belongs to another branch');
        }
      }
    }

    return vehicle;
  }

  async create(dto: CreateComplianceDocDto, user: any) {
    const vehicle = await this.validateVehicleAccess(dto.vehicleId, user);

    const calculatedStatus = this.computeDocStatus(dto.expiryDate, dto.status);

    const doc = await this.prisma.vehicleComplianceDocument.create({
      data: {
        vehicleId: dto.vehicleId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber.trim(),
        issuingAuthority: dto.issuingAuthority?.trim() || null,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        attachmentUrl: (dto.attachmentUrl || dto.fileUrl)?.trim() || null,
        notes: dto.notes?.trim() || null,
        status: calculatedStatus,
      },
      include: {
        vehicle: {
          include: {
            branch: true,
            customer: true,
            variant: { include: { model: { include: { manufacturer: true } } } },
          },
        },
      },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'COMPLIANCE_DOC_CREATED',
      entityType: 'VehicleComplianceDocument',
      entityId: doc.id,
      metadata: {
        vehicleId: dto.vehicleId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        status: calculatedStatus,
      },
    }).catch(() => {});

    return {
      ...doc,
      computedStatus: this.computeDocStatus(doc.expiryDate, doc.status),
    };
  }

  async findAll(
    user: any,
    filters?: {
      vehicleId?: string;
      documentType?: ComplianceDocType;
      status?: ComplianceDocStatus | string;
      search?: string;
      branchId?: string;
      franchiseId?: string;
      expiryBefore?: string;
      expiryAfter?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const scope = user ? (user.effectiveScope || (await resolveUserScope(this.prisma, user, filters?.branchId, filters?.franchiseId))) : null;

    const where: any = {};

    if (scope?.isCustomer) {
      const resolvedCustomerId =
        user?.customerId ||
        user?.customerProfile?.id ||
        (await this.prisma.customer.findFirst({ where: { userId: user.id } }))?.id;

      if (!resolvedCustomerId) {
        return { items: [], total: 0, limit: filters?.limit || 50, offset: filters?.offset || 0 };
      }
      where.vehicle = { customerId: resolvedCustomerId };
    } else if (scope && !scope.isActingSuperAdmin) {
      if (scope.isActingFranchiseLevel) {
        where.vehicle = {
          branch: { franchiseId: scope.effectiveFranchiseId },
        };
        if (scope.effectiveBranchId) {
          where.vehicle.branchId = scope.effectiveBranchId;
        }
      } else if (scope.effectiveBranchId) {
        where.vehicle = { branchId: scope.effectiveBranchId };
      }
    } else if (scope?.isActingSuperAdmin) {
      if (scope.effectiveBranchId) {
        where.vehicle = { branchId: scope.effectiveBranchId };
      } else if (scope.effectiveFranchiseId) {
        where.vehicle = { branch: { franchiseId: scope.effectiveFranchiseId } };
      }
    }

    if (filters?.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }

    if (filters?.documentType) {
      where.documentType = filters.documentType;
    }

    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim();
      where.OR = [
        { documentNumber: { contains: s, mode: 'insensitive' } },
        { issuingAuthority: { contains: s, mode: 'insensitive' } },
        { vehicle: { vin: { contains: s, mode: 'insensitive' } } },
        { vehicle: { registrationNumber: { contains: s, mode: 'insensitive' } } },
      ];
    }

    if (filters?.expiryBefore || filters?.expiryAfter) {
      where.expiryDate = {};
      if (filters.expiryBefore) {
        where.expiryDate.lte = new Date(filters.expiryBefore);
      }
      if (filters.expiryAfter) {
        where.expiryDate.gte = new Date(filters.expiryAfter);
      }
    }

    const limit = Number(filters?.limit) || 50;
    const offset = Number(filters?.offset) || 0;

    const [rawItems, total] = await Promise.all([
      this.prisma.vehicleComplianceDocument.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { expiryDate: 'asc' },
        include: {
          vehicle: {
            include: {
              branch: true,
              customer: true,
              variant: { include: { model: { include: { manufacturer: true } } } },
            },
          },
        },
      }),
      this.prisma.vehicleComplianceDocument.count({ where }),
    ]);

    const items = rawItems.map((doc) => {
      const computedStatus = this.computeDocStatus(doc.expiryDate, doc.status);
      return {
        ...doc,
        computedStatus,
      };
    });

    // If client requested specific status filter (e.g. EXPIRED, EXPIRING_SOON, VALID)
    const filteredItems = filters?.status && filters.status !== 'ALL'
      ? items.filter((d) => d.computedStatus === filters.status || d.status === filters.status)
      : items;

    return {
      items: filteredItems,
      total: filters?.status && filters.status !== 'ALL' ? filteredItems.length : total,
      limit,
      offset,
    };
  }

  async findOne(id: string, user: any) {
    const doc = await this.prisma.vehicleComplianceDocument.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            branch: true,
            customer: true,
            variant: { include: { model: { include: { manufacturer: true } } } },
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Compliance document '${id}' not found`);
    }

    await this.validateVehicleAccess(doc.vehicleId, user);

    return {
      ...doc,
      computedStatus: this.computeDocStatus(doc.expiryDate, doc.status),
    };
  }

  async update(id: string, dto: UpdateComplianceDocDto, user: any) {
    const existing = await this.findOne(id, user);

    const calculatedStatus = dto.expiryDate !== undefined
      ? this.computeDocStatus(dto.expiryDate, dto.status || existing.status)
      : dto.status || existing.status;

    const updated = await this.prisma.vehicleComplianceDocument.update({
      where: { id },
      data: {
        documentType: dto.documentType,
        documentNumber: dto.documentNumber ? dto.documentNumber.trim() : undefined,
        issuingAuthority: dto.issuingAuthority !== undefined ? dto.issuingAuthority?.trim() || null : undefined,
        issueDate: dto.issueDate !== undefined ? (dto.issueDate ? new Date(dto.issueDate) : null) : undefined,
        expiryDate: dto.expiryDate !== undefined ? (dto.expiryDate ? new Date(dto.expiryDate) : null) : undefined,
        attachmentUrl: (dto.attachmentUrl !== undefined || dto.fileUrl !== undefined)
          ? (dto.attachmentUrl || dto.fileUrl)?.trim() || null
          : undefined,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
        status: calculatedStatus,
      },
      include: {
        vehicle: {
          include: {
            branch: true,
            customer: true,
            variant: { include: { model: { include: { manufacturer: true } } } },
          },
        },
      },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'COMPLIANCE_DOC_UPDATED',
      entityType: 'VehicleComplianceDocument',
      entityId: id,
      metadata: { documentNumber: updated.documentNumber, status: calculatedStatus },
    }).catch(() => {});

    return {
      ...updated,
      computedStatus: this.computeDocStatus(updated.expiryDate, updated.status),
    };
  }

  async remove(id: string, user: any) {
    const existing = await this.findOne(id, user);

    await this.prisma.vehicleComplianceDocument.delete({ where: { id } });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'COMPLIANCE_DOC_DELETED',
      entityType: 'VehicleComplianceDocument',
      entityId: id,
      metadata: { documentNumber: existing.documentNumber },
    }).catch(() => {});

    return { success: true, message: 'Compliance record deleted' };
  }

  async getSummary(user: any, branchId?: string, franchiseId?: string) {
    const result = await this.findAll(user, { branchId, franchiseId, limit: 1000 });
    const docs = result.items;

    const summary = {
      total: docs.length,
      valid: 0,
      expiringSoon: 0,
      expired: 0,
      rejected: 0,
      byType: {} as Record<string, number>,
    };

    for (const doc of docs) {
      const status = doc.computedStatus;
      if (status === ComplianceDocStatus.VALID) summary.valid++;
      else if (status === ComplianceDocStatus.EXPIRING_SOON) summary.expiringSoon++;
      else if (status === ComplianceDocStatus.EXPIRED) summary.expired++;
      else if (status === ComplianceDocStatus.REJECTED) summary.rejected++;

      summary.byType[doc.documentType] = (summary.byType[doc.documentType] || 0) + 1;
    }

    return summary;
  }
}
