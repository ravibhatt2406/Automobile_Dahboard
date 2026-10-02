import { Injectable, NotFoundException } from '@nestjs/common';
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
        customerType: dto.customerType,
        companyName: dto.companyName,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: customer.id,
      metadata: { name: customer.name, phone: customer.phone },
    });

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
      whereCondition.franchiseLinks = {
        some: { franchiseId },
      };
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
        leads: { include: { branch: true } },
        quotations: { include: { variant: true } },
        bookings: { include: { vehicle: true } },
        invoices: true,
        vehicles: true,
        deliveries: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ID '${id}' not found`);
    }

    return customer;
  }

  async update(id: string, dto: Partial<CreateCustomerDto>, actorUserId: string) {
    await this.findOne(id);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      actorUserId,
      action: 'CUSTOMER_UPDATED',
      entityType: 'Customer',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }
}
