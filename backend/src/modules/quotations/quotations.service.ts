import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { AuditService } from '../audit/audit.service';
import { QuotationStatus } from '@prisma/client';

@Injectable()
export class QuotationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateQuotationDto, userOrId: any) {
    const creatorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    // Validate Customer - NO SILENT FALLBACK
    let customer: any = null;
    const isCustomer = user?.accountType === 'CUSTOMER' || (user?.roles?.includes('CUSTOMER') && !user?.employeeProfile);
    if (isCustomer) {
      const userCustId = user?.customerProfile?.id || user?.customerId;
      if (userCustId) {
        customer = await this.prisma.customer.findUnique({ where: { id: userCustId } });
      } else {
        customer = await this.prisma.customer.findFirst({ where: { userId: creatorUserId } });
      }
      if (!customer) {
        throw new ForbiddenException('No customer profile associated with user account');
      }
    } else if (dto.customerId) {
      customer = await this.prisma.customer.findFirst({
        where: { OR: [{ id: dto.customerId }, { phone: dto.customerId }, { email: dto.customerId }] },
      });
      if (!customer) {
        throw new NotFoundException(`Customer '${dto.customerId}' not found`);
      }
    } else if (creatorUserId) {
      customer = await this.prisma.customer.findFirst({ where: { userId: creatorUserId } });
    }
    if (!customer) {
      throw new BadRequestException('customerId is required for quotation');
    }

    // Validate Variant - NO SILENT FALLBACK
    if (!dto.variantId) {
      throw new BadRequestException('variantId is required for quotation');
    }
    const variant = await this.prisma.truckVariant.findFirst({
      where: { OR: [{ id: dto.variantId }, { name: dto.variantId }] },
    });
    if (!variant) {
      throw new NotFoundException(`Truck variant '${dto.variantId}' not found`);
    }

    // Validate Branch - NO SILENT FALLBACK
    let branch: any = null;
    const branchKey = dto.branchId || user?.assignedBranchId;
    if (branchKey) {
      branch = await this.prisma.branch.findFirst({
        where: { OR: [{ id: branchKey }, { code: branchKey }] },
      });
      if (!branch) {
        throw new NotFoundException(`Branch '${branchKey}' not found`);
      }
    } else {
      throw new BadRequestException('branchId is required for quotation');
    }

    // Validate Vehicle if provided (inventory-specific quotation)
    let selectedVehicle: any = null;
    if (dto.vehicleId) {
      selectedVehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
        include: { branch: true },
      });
      if (!selectedVehicle) {
        throw new NotFoundException(`Vehicle '${dto.vehicleId}' not found`);
      }
      if (selectedVehicle.branchId !== branch.id) {
        throw new BadRequestException(`Selected vehicle is located at branch '${selectedVehicle.branch.name}', not '${branch.name}'`);
      }
      if (!['IN_STOCK', 'RESERVED'].includes(selectedVehicle.status)) {
        throw new BadRequestException(`Vehicle is not available for quotation (current status: ${selectedVehicle.status})`);
      }
      if (variant && selectedVehicle.variantId !== variant.id) {
        throw new BadRequestException('Selected vehicle does not match the quotation variant');
      }
    }

    // Scope check on branch for creator
    if (user && !isCustomer) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
        if (isFranchiseLevel) {
          if (branch.franchiseId !== user.assignedFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Cannot create quotation in another franchise');
          }
        } else {
          // Branch level
          if (branch.id !== user.assignedBranchId && branch.code !== user.assignedBranchId) {
            throw new ForbiddenException('Multi-tenant scope violation: Cannot create quotation in another branch');
          }
        }
      }
    }

    // Validate Salesperson
    let salesperson: any = null;
    if (dto.salespersonEmployeeId) {
      salesperson = await this.prisma.employee.findFirst({
        where: { OR: [{ id: dto.salespersonEmployeeId }, { employeeCode: dto.salespersonEmployeeId }] },
      });
      if (!salesperson) {
        throw new NotFoundException(`Salesperson '${dto.salespersonEmployeeId}' not found`);
      }
    } else if (user?.employeeProfile?.id) {
      salesperson = user.employeeProfile;
    } else {
      salesperson = await this.prisma.employee.findFirst({
        where: { branchId: branch.id, status: 'ACTIVE' },
      });
      if (!salesperson && branch.franchiseId) {
        salesperson = await this.prisma.employee.findFirst({
          where: { branch: { franchiseId: branch.franchiseId }, status: 'ACTIVE' },
        });
      }
      if (!salesperson) {
        salesperson = await this.prisma.employee.findFirst({
          where: { status: 'ACTIVE' },
        });
      }
    }
    if (!salesperson) {
      throw new BadRequestException('No active salesperson found to process quotation');
    }

    const unitBasePrice = Number(variant.basePrice);
    const gstRate = Number(variant.gstRate);

    const quantity = dto.quantity || 1;
    const baseTotal = unitBasePrice * quantity;
    const accessories = dto.accessoriesAmount || 0;
    const insurance = dto.insuranceAmount || 0;
    const registration = dto.registrationAmount || 0;
    const financeCharges = dto.financeCharges || 0;
    const discount = dto.discountAmount || 0;

    const subtotal = baseTotal + accessories + insurance + registration + financeCharges - discount;
    const gstAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
    const totalAmount = subtotal + gstAmount;

    const quotationNumber = `QT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const status = discount > 50000 ? 'PENDING_APPROVAL' : 'SUBMITTED';
    const validityDate = dto.validityDate ? new Date(dto.validityDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: customer.id,
        leadId: dto.leadId || null,
        franchiseId: dto.franchiseId || branch.franchiseId,
        branchId: branch.id,
        salespersonEmployeeId: salesperson.id,
        createdByUserId: creatorUserId,
        variantId: variant.id,
        quantity,
        unitBasePrice,
        accessoriesAmount: accessories,
        insuranceAmount: insurance,
        registrationAmount: registration,
        financeCharges,
        discountAmount: discount,
        subtotal,
        gstRate,
        gstAmount,
        totalAmount,
        validityDate,
        status,
        notes: dto.notes,
      },
      include: {
        customer: true,
        variant: { include: { model: { include: { manufacturer: true } } } },
        branch: true,
        salesperson: true,
      },
    });

    await this.auditService.log({
      actorUserId: creatorUserId,
      action: 'QUOTATION_CREATED',
      entityType: 'Quotation',
      entityId: quotation.id,
      metadata: { quotationNumber, totalAmount, status: quotation.status },
    }).catch(() => {});

    return quotation;
  }

  async findAll(
    branchId?: string,
    customerId?: string,
    status?: QuotationStatus,
    limit = 50,
    offset = 0,
    user?: any,
  ) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
    const isCustomer = user?.accountType === 'CUSTOMER' || (roles.includes('CUSTOMER') && !user?.employeeProfile);

    const where: any = {};
    if (status) where.status = status;

    if (user && !isSuperAdmin) {
      if (isCustomer) {
        const userCustId = user.customerProfile?.id || user.customerId;
        where.customerId = userCustId;
      } else if (isFranchiseLevel) {
        if (branchId) {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: branchId }, { code: branchId }] },
          });
          if (!b || b.franchiseId !== user.assignedFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
          }
          where.branchId = b.id;
        } else {
          where.branch = { franchiseId: user.assignedFranchiseId };
        }
      } else {
        // Branch Level
        if (
          branchId &&
          branchId !== user.assignedBranchId &&
          branchId !== user.employeeProfile?.branch?.code
        ) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
        }
        where.branchId = user.assignedBranchId;
      }
    } else {
      if (branchId) where.branchId = branchId;
      if (customerId) where.customerId = customerId;
    }

    const [items, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          variant: { include: { model: { include: { manufacturer: true } } } },
          branch: true,
          salesperson: true,
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        franchise: true,
        branch: true,
        salesperson: true,
        variant: { include: { model: { include: { manufacturer: true } } } },
        bookings: true,
        items: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation ID '${id}' not found`);
    }

    if (user) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        const isCustomer = user.accountType === 'CUSTOMER' || (roles.includes('CUSTOMER') && !user.employeeProfile);
        if (isCustomer) {
          const userCustId = user.customerProfile?.id || user.customerId;
          if (quotation.customerId !== userCustId && quotation.customer?.userId !== user.id) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized quotation access attempt');
          }
        } else {
          const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
          if (isFranchiseLevel) {
            if (quotation.branch?.franchiseId !== user.assignedFranchiseId) {
              throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access');
            }
          } else {
            // Branch level
            if (quotation.branchId !== user.assignedBranchId) {
              throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
            }
          }
        }
      }
    }

    return quotation;
  }

  async approve(id: string, userOrId: any) {
    const approverUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const quotation = await this.findOne(id, user);

    if (quotation.status !== 'PENDING_APPROVAL' && quotation.status !== 'SUBMITTED') {
      throw new BadRequestException(`Quotation status '${quotation.status}' cannot be approved`);
    }

    if (quotation.createdByUserId === approverUserId) {
      const approver = await this.prisma.user.findUnique({ where: { id: approverUserId } });
      if (approver?.accountType !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Self-Approval Violation: You cannot approve a quotation you created');
      }
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    await this.auditService.log({
      actorUserId: approverUserId,
      action: 'QUOTATION_APPROVED',
      entityType: 'Quotation',
      entityId: id,
      metadata: { quotationNumber: quotation.quotationNumber },
    }).catch(() => {});

    return updated;
  }

  async reject(id: string, reason: string, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const quotation = await this.findOne(id, user);

    if (quotation.status === 'CONVERTED' || quotation.status === 'EXPIRED') {
      throw new BadRequestException(`Cannot reject a ${quotation.status} quotation`);
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'REJECTED', notes: `REJECTED: ${reason}` },
    });

    await this.auditService.log({
      actorUserId,
      action: 'QUOTATION_REJECTED',
      entityType: 'Quotation',
      entityId: id,
      metadata: { quotationNumber: quotation.quotationNumber, reason },
    }).catch(() => {});

    return updated;
  }

  async expire(id: string, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const quotation = await this.findOne(id, user);

    if (!['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'].includes(quotation.status)) {
      throw new BadRequestException(`Cannot expire quotation in status '${quotation.status}'`);
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });

    await this.auditService.log({
      actorUserId,
      action: 'QUOTATION_EXPIRED',
      entityType: 'Quotation',
      entityId: id,
      metadata: { quotationNumber: quotation.quotationNumber },
    }).catch(() => {});

    return updated;
  }
}
