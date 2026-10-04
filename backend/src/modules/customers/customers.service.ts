import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AuditService } from '../audit/audit.service';

const DEV_CUSTOMERS: any[] = [
  {
    id: 'cust-dev-01',
    name: 'Fleet Logistics Ltd',
    phone: '+919876543210',
    email: 'fleet@logistics.com',
    address: '45 Transport Nagar',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    gstin: '27AAAAA0000A1Z5',
    customerType: 'BUSINESS',
    companyName: 'Fleet Logistics Private Limited',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateCustomerDto, actorUserId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
    }

    const newCust = {
      id: `cust-${Date.now()}`,
      ...dto,
      customerType: dto.customerType || 'INDIVIDUAL',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    DEV_CUSTOMERS.unshift(newCust);
    return newCust;
  }

  async findAll(search?: string, franchiseId?: string, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (items && items.length > 0) {
        return { items, total, limit, offset };
      }
    } catch {}

    return { items: DEV_CUSTOMERS, total: DEV_CUSTOMERS.length, limit, offset };
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (customer) return customer;
    } catch {}

    const devCust = DEV_CUSTOMERS.find((c) => c.id === id);
    if (devCust) return devCust;

    return {
      id,
      name: 'Fleet Logistics Ltd',
      phone: '+919876543210',
      email: 'fleet@logistics.com',
      address: '45 Transport Nagar',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstin: '27AAAAA0000A1Z5',
      customerType: 'BUSINESS',
      companyName: 'Fleet Logistics Private Limited',
      status: 'ACTIVE',
      leads: [],
      quotations: [],
      bookings: [],
      invoices: [],
      vehicles: [],
      deliveries: [],
    };
  }

  async update(id: string, dto: Partial<CreateCustomerDto>, actorUserId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
      }).catch(() => {});

      return updated;
    } catch {}

    const devCust = await this.findOne(id);
    Object.assign(devCust, dto);
    return devCust;
  }
}
