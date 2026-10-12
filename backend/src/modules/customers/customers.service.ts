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

  async findAll(search?: string, franchiseId?: string, limit = 50, offset = 0, user?: any) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
    const isCustomer = user?.accountType === 'CUSTOMER' || (roles.includes('CUSTOMER') && !user?.employeeProfile);

    if (user && isCustomer) {
      throw new ForbiddenException('Unauthorized: Customers cannot enumerate customer list');
    }

    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (user && !isSuperAdmin) {
      if (isFranchiseLevel) {
        if (franchiseId && franchiseId !== user.assignedFranchiseId) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access');
        }
        whereCondition.franchiseLinks = { some: { franchiseId: user.assignedFranchiseId } };
      } else {
        // Branch Level
        whereCondition.OR = whereCondition.OR || [];
      }
    } else if (franchiseId) {
      whereCondition.franchiseLinks = { some: { franchiseId } };
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: whereCondition,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where: whereCondition }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        quotations: { include: { variant: true, branch: true } },
        bookings: {
          include: {
            vehicle: true,
            quotation: true,
            payments: true,
          },
        },
        invoices: true,
        vehicles: { include: { variant: { include: { model: true } } } },
        deliveries: true,
        insurancePolicies: true,
        serviceAppointments: true,
        serviceJobs: { include: { vehicle: true, branch: true } },
        franchiseLinks: true,
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
            const hasFranchiseLink =
              customer.franchiseLinks?.some((fl) => fl.franchiseId === user.assignedFranchiseId) ||
              customer.bookings?.some((b: any) => b.branch?.franchiseId === user.assignedFranchiseId);
            // If customer has any relation to franchise or is accessible
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
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CUSTOMER_UPDATED',
      entityType: 'Customer',
      entityId: id,
      metadata: { name: dto.name },
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
