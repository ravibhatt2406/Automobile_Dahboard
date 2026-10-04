import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateCustomerDto, actorUserId: string) {
    const customer = await this.prisma.customer.create({
      data: {
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

  async findAll(search?: string, franchiseId?: string, limit = 50, offset = 0) {
    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (franchiseId) {
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

  async findOne(id: string) {
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
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ID '${id}' not found`);
    }

    return customer;
  }

  async update(id: string, dto: Partial<CreateCustomerDto>, actorUserId: string) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Customer ID '${id}' not found`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
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

  async deactivate(id: string, actorUserId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            invoices: true,
            vehicles: true,
            serviceJobs: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ID '${id}' not found`);
    }

    if (customer.status === 'INACTIVE') {
      throw new BadRequestException(`Customer '${customer.name}' is already inactive`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CUSTOMER_DEACTIVATED',
      entityType: 'Customer',
      entityId: id,
      metadata: { name: customer.name },
    }).catch(() => {});

    return {
      success: true,
      message: `Customer '${customer.name}' deactivated. Historical records preserved.`,
      customer: updated,
    };
  }
}
