import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FranchisesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateFranchiseDto, actorUserId: string) {
    const existing = await this.prisma.franchise.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Franchise code '${dto.code}' already exists`);
    }

    const franchise = await this.prisma.franchise.create({
      data: {
        code: dto.code,
        name: dto.name,
        legalName: dto.legalName,
        taxId: dto.taxId,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'FRANCHISE_CREATED',
      entityType: 'Franchise',
      entityId: franchise.id,
      metadata: { code: franchise.code, name: franchise.name },
    }).catch(() => {});

    return franchise;
  }

  async findAll() {
    return this.prisma.franchise.findMany({
      include: { branches: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id },
      include: {
        branches: {
          include: {
            employees: {
              include: {
                roleAssignments: { include: { role: true } },
              },
            },
          },
        },
      },
    });

    if (!franchise) {
      throw new NotFoundException(`Franchise ID '${id}' not found`);
    }

    return franchise;
  }

  async update(id: string, dto: Partial<CreateFranchiseDto>, actorUserId: string) {
    const franchise = await this.prisma.franchise.update({
      where: { id },
      data: {
        name: dto.name,
        legalName: dto.legalName,
        taxId: dto.taxId,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'FRANCHISE_UPDATED',
      entityType: 'Franchise',
      entityId: franchise.id,
      metadata: { name: franchise.name },
    }).catch(() => {});

    return franchise;
  }

  async updateStatus(id: string, status: string, actorUserId: string) {
    const franchise = await this.prisma.franchise.update({
      where: { id },
      data: { status },
    });

    await this.auditService.log({
      actorUserId,
      action: status === 'ACTIVE' ? 'FRANCHISE_ACTIVATED' : 'FRANCHISE_DEACTIVATED',
      entityType: 'Franchise',
      entityId: franchise.id,
      metadata: { status },
    }).catch(() => {});

    return franchise;
  }
}
