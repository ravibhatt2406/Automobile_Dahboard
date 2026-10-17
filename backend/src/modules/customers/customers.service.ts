import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateCustomerDto, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');

    if (user && !isSuperAdmin) {
      throw new ForbiddenException(
        'Employee accounts cannot directly create customer records. Customers must self-register via the public portal.',
      );
    }

    const customer = await this.prisma.customer.create({
      data: {
        userId: user?.accountType === 'CUSTOMER' ? user.id : undefined,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        gstin: dto.gstin,
        customerType: dto.customerType || 'INDIVIDUAL',
        companyName: dto.companyName,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: customer.id,
      metadata: { name: customer.name, phone: customer.phone },
    }).catch(() => {});

    return customer;
  }

  async findAll(
    search?: string,
    branchIdFilter?: string,
    franchiseIdFilter?: string,
    customerType?: string,
    status?: string,
    limit = 50,
    offset = 0,
    user?: any,
  ) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel =
      !isSuperAdmin && roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
    const isBranchLevel = !isSuperAdmin && !isFranchiseLevel;
    const isCustomer = user?.accountType === 'CUSTOMER' || (roles.includes('CUSTOMER') && !user?.employeeProfile);

    if (user && isCustomer) {
      throw new ForbiddenException('Unauthorized: Customers cannot enumerate customer directory');
    }

    const conditions: any[] = [];

    // 1. Text Search across name, phone, email, and companyName
    if (search && search.trim()) {
      const term = search.trim();
      conditions.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { companyName: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    // 2. Customer Type Filter
    if (customerType && ['INDIVIDUAL', 'BUSINESS'].includes(customerType)) {
      conditions.push({ customerType });
    }

    // 3. Status Filter
    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
      conditions.push({ status });
    }

    // 4. Multi-Tenant Scope Enforcement
    if (user && !isSuperAdmin) {
      if (isBranchLevel) {
        const assignedBranchId = user.assignedBranchId || user.branchId;
        if (!assignedBranchId) {
          throw new ForbiddenException('Branch user does not have an assigned branch scope');
        }
        // Customer must be associated with the employee's branch through preferred branch or any legitimate operation
        conditions.push({
          OR: [
            { preferredBranchId: assignedBranchId },
            { quotations: { some: { branchId: assignedBranchId } } },
            { bookings: { some: { branchId: assignedBranchId } } },
            { vehicles: { some: { branchId: assignedBranchId } } },
            { leads: { some: { branchId: assignedBranchId } } },
            { serviceAppointments: { some: { branchId: assignedBranchId } } },
            { serviceJobs: { some: { branchId: assignedBranchId } } },
            { conversations: { some: { branchId: assignedBranchId } } },
            { invoices: { some: { branchId: assignedBranchId } } },
          ],
        });
      } else if (isFranchiseLevel) {
        const assignedFranchiseId = user.assignedFranchiseId || user.franchiseId;
        if (!assignedFranchiseId) {
          throw new ForbiddenException('Franchise user does not have an assigned franchise scope');
        }
        if (franchiseIdFilter && franchiseIdFilter !== 'ALL' && franchiseIdFilter !== assignedFranchiseId) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access');
        }
        conditions.push({
          OR: [
            { preferredBranch: { franchiseId: assignedFranchiseId } },
            { franchiseLinks: { some: { franchiseId: assignedFranchiseId } } },
            { leads: { some: { franchiseId: assignedFranchiseId } } },
            { quotations: { some: { franchiseId: assignedFranchiseId } } },
            { bookings: { some: { branch: { franchiseId: assignedFranchiseId } } } },
            { vehicles: { some: { branch: { franchiseId: assignedFranchiseId } } } },
            { serviceJobs: { some: { branch: { franchiseId: assignedFranchiseId } } } },
            { serviceAppointments: { some: { branch: { franchiseId: assignedFranchiseId } } } },
            { conversations: { some: { branch: { franchiseId: assignedFranchiseId } } } },
            { invoices: { some: { branch: { franchiseId: assignedFranchiseId } } } },
          ],
        });

        if (branchIdFilter && branchIdFilter !== 'ALL') {
          const b = await this.prisma.branch.findFirst({
            where: { id: branchIdFilter, franchiseId: assignedFranchiseId },
          });
          if (!b) {
            throw new ForbiddenException('Multi-tenant scope violation: Branch does not belong to your franchise');
          }
          conditions.push({
            OR: [
              { preferredBranchId: branchIdFilter },
              { quotations: { some: { branchId: branchIdFilter } } },
              { bookings: { some: { branchId: branchIdFilter } } },
              { vehicles: { some: { branchId: branchIdFilter } } },
              { leads: { some: { branchId: branchIdFilter } } },
              { serviceAppointments: { some: { branchId: branchIdFilter } } },
              { serviceJobs: { some: { branchId: branchIdFilter } } },
              { conversations: { some: { branchId: branchIdFilter } } },
              { invoices: { some: { branchId: branchIdFilter } } },
            ],
          });
        }
      }
    } else {
      // Super Admin or unauthenticated internal
      if (franchiseIdFilter && franchiseIdFilter !== 'ALL') {
        conditions.push({
          OR: [
            { preferredBranch: { franchiseId: franchiseIdFilter } },
            { franchiseLinks: { some: { franchiseId: franchiseIdFilter } } },
            { leads: { some: { franchiseId: franchiseIdFilter } } },
            { quotations: { some: { franchiseId: franchiseIdFilter } } },
            { bookings: { some: { branch: { franchiseId: franchiseIdFilter } } } },
            { vehicles: { some: { branch: { franchiseId: franchiseIdFilter } } } },
            { serviceJobs: { some: { branch: { franchiseId: franchiseIdFilter } } } },
            { serviceAppointments: { some: { branch: { franchiseId: franchiseIdFilter } } } },
            { conversations: { some: { branch: { franchiseId: franchiseIdFilter } } } },
          ],
        });
        if (branchIdFilter && branchIdFilter !== 'ALL') {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: branchIdFilter }, { code: branchIdFilter }] },
          });
          if (b && b.franchiseId !== franchiseIdFilter) {
            throw new BadRequestException('Selected branch does not belong to the selected franchise');
          }
        }
      }
      if (branchIdFilter && branchIdFilter !== 'ALL') {
        conditions.push({
          OR: [
            { preferredBranchId: branchIdFilter },
            { quotations: { some: { branchId: branchIdFilter } } },
            { bookings: { some: { branchId: branchIdFilter } } },
            { vehicles: { some: { branchId: branchIdFilter } } },
            { leads: { some: { branchId: branchIdFilter } } },
            { serviceAppointments: { some: { branchId: branchIdFilter } } },
            { serviceJobs: { some: { branchId: branchIdFilter } } },
            { conversations: { some: { branchId: branchIdFilter } } },
            { invoices: { some: { branchId: branchIdFilter } } },
          ],
        });
      }
    }

    const whereCondition = conditions.length > 0 ? { AND: conditions } : {};

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: whereCondition,
        include: {
          franchiseLinks: { include: { franchise: true } },
          _count: {
            select: {
              vehicles: true,
              bookings: true,
              quotations: true,
              serviceJobs: true,
              leads: true,
            },
          },
          vehicles: {
            select: {
              id: true,
              registrationNumber: true,
              vin: true,
              branchId: true,
              branch: { select: { id: true, name: true, code: true } },
            },
            take: 3,
          },
          bookings: {
            select: {
              id: true,
              bookingNumber: true,
              branchId: true,
              branch: { select: { id: true, name: true, code: true } },
            },
            take: 3,
          },
          quotations: {
            select: {
              id: true,
              quotationNumber: true,
              branchId: true,
              branch: { select: { id: true, name: true, code: true } },
            },
            take: 3,
          },
          serviceJobs: {
            select: {
              id: true,
              jobNumber: true,
              branchId: true,
              branch: { select: { id: true, name: true, code: true } },
            },
            take: 3,
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where: whereCondition }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user?: any) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        quotations: {
          include: {
            variant: { include: { model: { include: { manufacturer: true } } } },
            branch: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          include: {
            vehicle: { include: { variant: true } },
            quotation: true,
            payments: true,
            branch: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: { include: { branch: true }, orderBy: { createdAt: 'desc' } },
        vehicles: {
          include: {
            variant: { include: { model: true } },
            branch: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        deliveries: { orderBy: { createdAt: 'desc' } },
        insurancePolicies: { orderBy: { createdAt: 'desc' } },
        financeApplications: { orderBy: { createdAt: 'desc' } },
        serviceAppointments: { include: { branch: true }, orderBy: { createdAt: 'desc' } },
        serviceJobs: {
          include: {
            vehicle: true,
            branch: true,
            serviceAdvisor: true,
            assignedMechanic: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        conversations: { include: { branch: true }, orderBy: { lastMessageAt: 'desc' } },
        leads: { include: { branch: true }, orderBy: { createdAt: 'desc' } },
        franchiseLinks: { include: { franchise: true } },
        preferredBranch: { select: { id: true, code: true, name: true, city: true, state: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ID '${id}' not found`);
    }

    if (user) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');

      if (!isSuperAdmin) {
        const isCustomer = user.accountType === 'CUSTOMER' || (roles.includes('CUSTOMER') && !user.employeeProfile);

        if (isCustomer) {
          const userCustId = user.customerProfile?.id || user.customerId;
          const isOwner =
            customer.id === userCustId ||
            customer.userId === user.id ||
            (user.email && customer.email && customer.email.toLowerCase() === user.email.toLowerCase());
          if (!isOwner) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized customer access attempt');
          }
        } else {
          const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));

          if (isFranchiseLevel) {
            const franchiseId = user.assignedFranchiseId || user.franchiseId;
            const hasFranchiseLink =
              customer.franchiseLinks?.some((fl) => fl.franchiseId === franchiseId) ||
              customer.leads?.some((l) => l.franchiseId === franchiseId) ||
              customer.quotations?.some((q) => q.franchiseId === franchiseId) ||
              customer.bookings?.some((b: any) => b.branch?.franchiseId === franchiseId) ||
              customer.vehicles?.some((v: any) => v.branch?.franchiseId === franchiseId) ||
              customer.serviceJobs?.some((sj: any) => sj.branch?.franchiseId === franchiseId) ||
              customer.serviceAppointments?.some((sa: any) => sa.branch?.franchiseId === franchiseId) ||
              customer.conversations?.some((c: any) => c.branch?.franchiseId === franchiseId);

            if (!hasFranchiseLink) {
              throw new ForbiddenException(
                'Multi-tenant scope violation: Customer is not associated with your authorized franchise',
              );
            }
          } else {
            // Branch Level
            const branchId = user.assignedBranchId || user.branchId;
            const hasBranchLink =
              customer.quotations?.some((q) => q.branchId === branchId) ||
              customer.bookings?.some((b) => b.branchId === branchId) ||
              customer.vehicles?.some((v) => v.branchId === branchId) ||
              customer.leads?.some((l) => l.branchId === branchId) ||
              customer.serviceAppointments?.some((sa) => sa.branchId === branchId) ||
              customer.serviceJobs?.some((sj) => sj.branchId === branchId) ||
              customer.conversations?.some((c) => c.branchId === branchId) ||
              customer.invoices?.some((inv) => inv.branchId === branchId);

            if (!hasBranchLink) {
              throw new ForbiddenException(
                'Multi-tenant scope violation: Customer is not associated with your authorized branch',
              );
            }
          }
        }
      }
    }

    return customer;
  }

  async update(id: string, dto: Partial<CreateCustomerDto>, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const existing = await this.findOne(id, user);

    let preferredBranchIdUpdate: string | null | undefined = undefined;
    if ('preferredBranchId' in dto) {
      if (dto.preferredBranchId && dto.preferredBranchId.trim() !== '') {
        const branch = await this.prisma.branch.findUnique({
          where: { id: dto.preferredBranchId.trim() },
        });
        if (!branch) {
          throw new NotFoundException(`Branch '${dto.preferredBranchId}' not found`);
        }
        if (branch.status !== 'ACTIVE') {
          throw new BadRequestException(`Cannot select inactive branch '${branch.name}' as preferred branch`);
        }
        preferredBranchIdUpdate = branch.id;
      } else {
        preferredBranchIdUpdate = null;
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        gstin: dto.gstin,
        companyName: dto.companyName,
        ...(preferredBranchIdUpdate !== undefined ? { preferredBranchId: preferredBranchIdUpdate } : {}),
      },
      include: {
        preferredBranch: { select: { id: true, code: true, name: true, city: true, state: true } },
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CUSTOMER_UPDATED',
      entityType: 'Customer',
      entityId: id,
      metadata: { name: dto.name, preferredBranchId: preferredBranchIdUpdate },
    }).catch(() => {});

    return updated;
  }

  async deactivate(id: string, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const existing = await this.findOne(id, user);

    if (existing.status === 'INACTIVE') {
      throw new BadRequestException(`Customer '${existing.name}' is already inactive`);
    }

    const updated = await this.prisma.customer.update({
      where: { id: existing.id },
      data: { status: 'INACTIVE' },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CUSTOMER_DEACTIVATED',
      entityType: 'Customer',
      entityId: id,
      metadata: { name: existing.name },
    }).catch(() => {});

    return {
      success: true,
      message: `Customer '${existing.name}' deactivated. Historical records preserved.`,
      customer: updated,
    };
  }
}
