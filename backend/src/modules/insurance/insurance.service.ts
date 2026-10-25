import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { UpdateInsurancePolicyDto } from './dto/update-insurance-policy.dto';
import { RenewInsurancePolicyDto } from './dto/renew-insurance-policy.dto';
import { AuditService } from '../audit/audit.service';
import { InsuranceStatus, Prisma } from '@prisma/client';
import { resolveUserScope } from '@/common/utils/scope.util';

@Injectable()
export class InsuranceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateInsurancePolicyDto, actorUserId: string, user?: any) {
    // 1. Date validation
    const start = new Date(dto.startDate);
    const expiry = new Date(dto.expiryDate);
    if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
      throw new BadRequestException('Invalid start or expiry date provided.');
    }
    if (expiry <= start) {
      throw new BadRequestException('Policy expiry date must be strictly after the start date.');
    }

    if (Number(dto.premium) <= 0) {
      throw new BadRequestException('Insurance premium must be a positive number.');
    }

    // 2. Customer validation
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ID '${dto.customerId}' not found in database.`);
    }

    // 3. Vehicle validation
    let resolvedVehicleId = dto.vehicleId || null;
    let vehicle: any = null;
    if (resolvedVehicleId) {
      vehicle = await this.prisma.vehicle.findUnique({
        where: { id: resolvedVehicleId },
        include: { branch: true },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehicle ID '${resolvedVehicleId}' not found.`);
      }
    }

    // 4. Resolve or validate booking
    let resolvedBookingId = dto.bookingId;
    if (resolvedBookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: resolvedBookingId },
        include: { branch: true, vehicle: true },
      });
      if (!booking) {
        throw new NotFoundException(`Booking ID '${resolvedBookingId}' not found.`);
      }
      if (booking.customerId !== dto.customerId) {
        throw new BadRequestException(`Booking ID '${resolvedBookingId}' does not belong to the selected customer.`);
      }
      if (resolvedVehicleId && booking.vehicleId && booking.vehicleId !== resolvedVehicleId) {
        throw new BadRequestException('Selected vehicle does not match the vehicle linked to the selected booking.');
      }
      if (!resolvedVehicleId && booking.vehicleId) {
        resolvedVehicleId = booking.vehicleId;
      }

      // Check tenant scope for booking
      if (user) {
        const scope = user.effectiveScope || (await resolveUserScope(this.prisma, user));
        if (!scope.isActingSuperAdmin) {
          if (scope.isActingFranchiseLevel) {
            if (scope.effectiveFranchiseId && booking.branch?.franchiseId !== scope.effectiveFranchiseId) {
              throw new ForbiddenException('Booking belongs to another franchise.');
            }
          } else if (scope.effectiveBranchId && booking.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Booking belongs to another branch.');
          }
        }
      }
    } else {
      // Find a matching booking for this customer and vehicle, or find an existing booking for customer
      const candidateBookings = await this.prisma.booking.findMany({
        where: {
          customerId: dto.customerId,
          ...(resolvedVehicleId ? { vehicleId: resolvedVehicleId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { branch: true },
      });

      // Pick one without existing insurance
      let availableBooking: any = null;
      for (const b of candidateBookings) {
        const existingPol = await this.prisma.insurancePolicy.findUnique({
          where: { bookingId: b.id },
        });
        if (!existingPol) {
          availableBooking = b;
          break;
        }
      }

      if (!availableBooking) {
        // If candidate bookings exist, check if any exists at all
        if (candidateBookings.length > 0) {
          throw new ConflictException(
            'All existing bookings for this customer/vehicle already have an associated insurance policy.',
          );
        }
        throw new BadRequestException(
          'No booking found for this customer and vehicle. An active deal booking is required to record commercial insurance.',
        );
      }

      resolvedBookingId = availableBooking.id;
      if (!resolvedVehicleId && availableBooking.vehicleId) {
        resolvedVehicleId = availableBooking.vehicleId;
      }
    }

    if (!resolvedBookingId) {
      throw new BadRequestException('A valid deal booking ID is required to record commercial insurance.');
    }

    // Check conflict on booking
    const existing = await this.prisma.insurancePolicy.findUnique({
      where: { bookingId: resolvedBookingId },
    });
    if (existing) {
      throw new ConflictException(
        `Insurance policy (${existing.policyNumber}) already exists for Booking ID '${resolvedBookingId}'`,
      );
    }

    const policyNumber = dto.policyNumber || `POL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Verify unique policy number
    const duplicatePol = await this.prisma.insurancePolicy.findUnique({
      where: { policyNumber },
    });
    if (duplicatePol) {
      throw new ConflictException(`Policy number '${policyNumber}' is already registered in the system.`);
    }

    const policy = await this.prisma.insurancePolicy.create({
      data: {
        policyNumber,
        customerId: dto.customerId,
        bookingId: resolvedBookingId,
        vehicleId: resolvedVehicleId,
        insurer: dto.insurer,
        policyType: dto.policyType,
        premium: new Prisma.Decimal(dto.premium),
        startDate: start,
        expiryDate: expiry,
        documentKey: dto.documentKey || null,
        notes: dto.notes || null,
        coverageDetails: dto.coverageDetails || null,
        status: dto.status || InsuranceStatus.ACTIVE,
        isManual: true,
      },
      include: {
        customer: true,
        booking: {
          include: {
            branch: { include: { franchise: true } },
            quotation: { include: { variant: true } },
            vehicle: true,
          },
        },
        vehicle: {
          include: { variant: true, branch: true },
        },
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'INSURANCE_POLICY_CREATED',
      entityType: 'InsurancePolicy',
      entityId: policy.id,
      metadata: {
        policyNumber,
        insurer: dto.insurer,
        premium: dto.premium,
        customerId: dto.customerId,
        vehicleId: resolvedVehicleId,
        bookingId: resolvedBookingId,
      },
    }).catch(() => {});

    return policy;
  }

  async findAll(
    customerId?: string,
    status?: InsuranceStatus,
    limit = 50,
    offset = 0,
    user?: any,
    branchId?: string,
    franchiseId?: string,
    search?: string,
    vehicleId?: string,
  ) {
    const where: any = {};
    const scope = user?.effectiveScope || (user ? await resolveUserScope(this.prisma, user, branchId, franchiseId) : null);

    if (scope?.isCustomer) {
      const resolvedCustomerId =
        user?.customerId ||
        user?.customerProfile?.id ||
        (await this.prisma.customer.findFirst({ where: { userId: user?.id } }))?.id;
      if (!resolvedCustomerId) {
        return { items: [], total: 0, limit, offset };
      }
      where.customerId = resolvedCustomerId;
    } else if (scope && !scope.isActingSuperAdmin) {
      if (scope.isActingFranchiseLevel) {
        where.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
        if (scope.effectiveBranchId) {
          where.booking = { branchId: scope.effectiveBranchId };
        }
      } else {
        where.booking = { branchId: scope.effectiveBranchId };
      }
    } else if (scope?.isActingSuperAdmin) {
      if (scope.effectiveFranchiseId) {
        where.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
        if (scope.effectiveBranchId) {
          where.booking = { branchId: scope.effectiveBranchId };
        }
      } else if (scope.effectiveBranchId) {
        where.booking = { branchId: scope.effectiveBranchId };
      }
    }

    if (customerId) where.customerId = customerId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { policyNumber: { contains: term, mode: 'insensitive' } },
        { insurer: { contains: term, mode: 'insensitive' } },
        { policyType: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
        { vehicle: { vin: { contains: term, mode: 'insensitive' } } },
        { vehicle: { registrationNumber: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.insurancePolicy.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          booking: {
            include: {
              branch: { include: { franchise: true } },
              quotation: { include: { variant: true } },
              vehicle: true,
            },
          },
          vehicle: {
            include: { variant: true, branch: true },
          },
        },
      }),
      this.prisma.insurancePolicy.count({ where }),
    ]);

    // Live expiring check
    const now = new Date();
    const enriched = items.map((p) => {
      const expiry = new Date(p.expiryDate);
      const isExpiringSoon = p.status === 'ACTIVE' && expiry > now && expiry.getTime() - now.getTime() <= 30 * 24 * 3600 * 1000;
      const isExpired = p.status === 'EXPIRED' || (p.status === 'ACTIVE' && expiry < now);

      return {
        ...p,
        isExpiringSoon,
        isExpired,
      };
    });

    return { items: enriched, total, limit, offset };
  }

  async getDashboardStats(user?: any, branchId?: string, franchiseId?: string) {
    const scope = user?.effectiveScope || (user ? await resolveUserScope(this.prisma, user, branchId, franchiseId) : null);
    const where: any = {};

    if (scope?.isCustomer) {
      const resolvedCustomerId =
        user?.customerId ||
        user?.customerProfile?.id ||
        (await this.prisma.customer.findFirst({ where: { userId: user?.id } }))?.id;
      if (!resolvedCustomerId) {
        return {
          total: 0,
          active: 0,
          expiringSoon: 0,
          expired: 0,
          pending: 0,
        };
      }
      where.customerId = resolvedCustomerId;
    } else if (scope && !scope.isActingSuperAdmin) {
      if (scope.isActingFranchiseLevel) {
        where.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
        if (scope.effectiveBranchId) {
          where.booking = { branchId: scope.effectiveBranchId };
        }
      } else {
        where.booking = { branchId: scope.effectiveBranchId };
      }
    } else if (scope?.isActingSuperAdmin) {
      if (scope.effectiveFranchiseId) {
        where.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
        if (scope.effectiveBranchId) {
          where.booking = { branchId: scope.effectiveBranchId };
        }
      } else if (scope.effectiveBranchId) {
        where.booking = { branchId: scope.effectiveBranchId };
      }
    }

    const allPolicies = await this.prisma.insurancePolicy.findMany({
      where,
      select: {
        id: true,
        status: true,
        expiryDate: true,
      },
    });

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let pending = 0;

    for (const p of allPolicies) {
      const exp = new Date(p.expiryDate);
      if (p.status === 'PENDING') {
        pending++;
      } else if (p.status === 'CANCELLED') {
        // Not counted in active or expired
      } else if (exp < now || p.status === 'EXPIRED') {
        expired++;
      } else if (p.status === 'ACTIVE') {
        active++;
        if (exp <= in30Days && exp >= now) {
          expiringSoon++;
        }
      }
    }

    return {
      total: allPolicies.length,
      active,
      expiringSoon,
      expired,
      pending,
    };
  }

  async findOne(id: string, user?: any) {
    const policy = await this.prisma.insurancePolicy.findUnique({
      where: { id },
      include: {
        customer: true,
        booking: {
          include: {
            branch: { include: { franchise: true } },
            quotation: { include: { variant: true } },
            vehicle: true,
          },
        },
        vehicle: {
          include: { variant: true, branch: true },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException(`Insurance Policy ID '${id}' not found`);
    }

    // Strict multi-branch authorization
    if (user) {
      const scope = user.effectiveScope || (await resolveUserScope(this.prisma, user));
      if (scope.isCustomer) {
        const userCustId =
          user.customerId ||
          user.customerProfile?.id ||
          (await this.prisma.customer.findFirst({ where: { userId: user.id } }))?.id;
        if (!userCustId || policy.customerId !== userCustId) {
          throw new ForbiddenException('Access denied to insurance policy');
        }
      } else if (!scope.isActingSuperAdmin) {
        const branchId = policy.booking?.branchId || policy.vehicle?.branchId;
        const franchiseId = policy.booking?.branch?.franchiseId || policy.vehicle?.branch?.franchiseId;

        if (scope.isActingFranchiseLevel) {
          if (scope.effectiveFranchiseId && franchiseId !== scope.effectiveFranchiseId) {
            throw new ForbiddenException('Access denied to insurance policy in another franchise');
          }
          if (scope.effectiveBranchId && branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to insurance policy in another branch');
          }
        } else {
          if (scope.effectiveBranchId && branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to insurance policy in another branch');
          }
        }
      }
    }

    const now = new Date();
    const expiry = new Date(policy.expiryDate);
    const isExpiringSoon = policy.status === 'ACTIVE' && expiry > now && expiry.getTime() - now.getTime() <= 30 * 24 * 3600 * 1000;
    const isExpired = policy.status === 'EXPIRED' || (policy.status === 'ACTIVE' && expiry < now);

    return {
      ...policy,
      isExpiringSoon,
      isExpired,
    };
  }

  async update(id: string, dto: UpdateInsurancePolicyDto, actorUserId: string, user?: any) {
    const existing = await this.findOne(id, user);

    const data: Prisma.InsurancePolicyUpdateInput = {};

    if (dto.insurer !== undefined) data.insurer = dto.insurer;
    if (dto.policyType !== undefined) data.policyType = dto.policyType;
    if (dto.premium !== undefined) {
      if (Number(dto.premium) <= 0) throw new BadRequestException('Premium must be positive.');
      data.premium = new Prisma.Decimal(dto.premium);
    }
    if (dto.documentKey !== undefined) data.documentKey = dto.documentKey;
    if (dto.coverageDetails !== undefined) data.coverageDetails = dto.coverageDetails;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) data.status = dto.status;

    let newStart = dto.startDate ? new Date(dto.startDate) : new Date(existing.startDate);
    let newExpiry = dto.expiryDate ? new Date(dto.expiryDate) : new Date(existing.expiryDate);

    if (dto.startDate || dto.expiryDate) {
      if (isNaN(newStart.getTime()) || isNaN(newExpiry.getTime())) {
        throw new BadRequestException('Invalid date provided.');
      }
      if (newExpiry <= newStart) {
        throw new BadRequestException('Policy expiry date must be strictly after the start date.');
      }
      if (dto.startDate) data.startDate = newStart;
      if (dto.expiryDate) data.expiryDate = newExpiry;
    }

    const updated = await this.prisma.insurancePolicy.update({
      where: { id },
      data,
      include: {
        customer: true,
        booking: {
          include: {
            branch: { include: { franchise: true } },
            vehicle: true,
          },
        },
        vehicle: true,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'INSURANCE_POLICY_UPDATED',
      entityType: 'InsurancePolicy',
      entityId: id,
      metadata: {
        policyNumber: existing.policyNumber,
        changes: dto,
      },
    }).catch(() => {});

    return updated;
  }

  async renew(id: string, dto: RenewInsurancePolicyDto, actorUserId: string, user?: any) {
    const existing = await this.findOne(id, user);

    const start = new Date(dto.newStartDate);
    const expiry = new Date(dto.newExpiryDate);
    if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
      throw new BadRequestException('Invalid renewal dates provided.');
    }
    if (expiry <= start) {
      throw new BadRequestException('Renewal expiry date must be after the renewal start date.');
    }

    if (Number(dto.newPremium) <= 0) {
      throw new BadRequestException('Renewal premium must be positive.');
    }

    const updatedNotes = `${existing.notes || ''}\n[RENEWAL on ${new Date().toISOString().slice(0, 10)}] ${dto.notes || 'Policy successfully renewed.'}`.trim();

    const updated = await this.prisma.insurancePolicy.update({
      where: { id },
      data: {
        startDate: start,
        expiryDate: expiry,
        premium: new Prisma.Decimal(dto.newPremium),
        status: InsuranceStatus.ACTIVE,
        insurer: dto.insurer || existing.insurer,
        policyType: dto.policyType || existing.policyType,
        policyNumber: dto.newPolicyNumber || existing.policyNumber,
        documentKey: dto.documentKey || existing.documentKey,
        notes: updatedNotes,
      },
      include: {
        customer: true,
        booking: {
          include: {
            branch: { include: { franchise: true } },
            vehicle: true,
          },
        },
        vehicle: true,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'INSURANCE_POLICY_RENEWED',
      entityType: 'InsurancePolicy',
      entityId: id,
      metadata: {
        previousTerm: {
          startDate: existing.startDate,
          expiryDate: existing.expiryDate,
          premium: existing.premium,
        },
        newTerm: {
          startDate: start,
          expiryDate: expiry,
          premium: dto.newPremium,
          policyNumber: dto.newPolicyNumber || existing.policyNumber,
        },
      },
    }).catch(() => {});

    return updated;
  }

  async updateStatus(id: string, status: InsuranceStatus, actorUserId: string, user?: any) {
    const existing = await this.findOne(id, user);

    const updated = await this.prisma.insurancePolicy.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        booking: {
          include: { branch: true, vehicle: true },
        },
        vehicle: true,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: `INSURANCE_POLICY_${status}`,
      entityType: 'InsurancePolicy',
      entityId: id,
      metadata: { policyNumber: existing.policyNumber, previousStatus: existing.status, newStatus: status },
    }).catch(() => {});

    return updated;
  }

  async getHistory(id: string, user?: any) {
    // Check permission & tenancy
    await this.findOne(id, user);

    return this.prisma.auditLog.findMany({
      where: {
        entityType: 'InsurancePolicy',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        actorUser: {
          select: { id: true, email: true, accountType: true },
        },
      },
    });
  }

  async attachDocument(id: string, fileDto: any, actorUserId: string, user?: any) {
    const policy = await this.findOne(id, user);

    const fileId = `FILE-INS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const file = await this.prisma.fileAttachment.create({
      data: {
        fileId,
        entityType: 'InsurancePolicy',
        entityId: id,
        storageKey: fileDto.storageKey || `insurance/${policy.policyNumber}/${fileDto.filename || 'certificate.pdf'}`,
        filename: fileDto.filename || 'insurance_certificate.pdf',
        mimeType: fileDto.mimeType || 'application/pdf',
        size: fileDto.size || 1024,
        uploadedByUserId: actorUserId,
      },
    });

    await this.prisma.insurancePolicy.update({
      where: { id },
      data: { documentKey: file.storageKey },
    });

    await this.auditService.log({
      actorUserId,
      action: 'INSURANCE_DOCUMENT_ATTACHED',
      entityType: 'InsurancePolicy',
      entityId: id,
      metadata: { fileId, filename: file.filename, storageKey: file.storageKey },
    }).catch(() => {});

    return file;
  }
}
