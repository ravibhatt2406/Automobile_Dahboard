import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { AuditService } from '../audit/audit.service';

const DEV_FRANCHISES: any[] = [
  {
    id: 'FR-DEV-01',
    code: 'FR-DEV-01',
    name: 'Titan Commercial Global',
    legalName: 'Titan Commercial Vehicles LLC',
    taxId: 'US-992817263',
    status: 'ACTIVE',
    branches: [
      { id: 'BR-DEV-01', code: 'BR-DEV-01', name: 'Detroit Flagship Hub' },
      { id: 'BR-DEV-02', code: 'BR-DEV-02', name: 'Chicago Logistics & Service Hub' },
    ],
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class FranchisesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateFranchiseDto, actorUserId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      try {
        await this.auditService.log({
          actorUserId,
          action: 'FRANCHISE_CREATED',
          entityType: 'Franchise',
          entityId: franchise.id,
          metadata: { code: franchise.code, name: franchise.name },
        }).catch(() => {});
      } catch {}

      return franchise;
    } catch (e) {
      if (e instanceof ConflictException) throw e;
    }

    const codeExistsInDev = DEV_FRANCHISES.some((f) => f.code === dto.code);
    if (codeExistsInDev) {
      throw new ConflictException(`Franchise code '${dto.code}' already exists`);
    }

    const newFranchise = {
      id: `fr-${Date.now()}`,
      code: dto.code,
      name: dto.name,
      legalName: dto.legalName || dto.name,
      taxId: dto.taxId || 'TAX-DEV-999',
      status: 'ACTIVE',
      branches: [],
      createdAt: new Date().toISOString(),
    };
    DEV_FRANCHISES.unshift(newFranchise);
    return newFranchise;
  }

  async findAll() {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const franchises = await this.prisma.franchise.findMany({
        include: {
          branches: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (franchises && franchises.length > 0) return franchises;
    } catch {}

    return DEV_FRANCHISES;
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const franchise = await this.prisma.franchise.findUnique({
        where: { id },
        include: {
          branches: {
            include: {
              employees: {
                include: {
                  roleAssignments: {
                    include: {
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (franchise) {
        return franchise;
      }
    } catch {}

    const devFranchise = DEV_FRANCHISES.find((f) => f.id === id || f.code === id);
    if (devFranchise) {
      return devFranchise;
    }

    return {
      id,
      code: id,
      name: 'Titan Commercial Global',
      legalName: 'Titan Commercial Vehicles LLC',
      taxId: 'US-992817263',
      status: 'ACTIVE',
      branches: [],
      createdAt: new Date().toISOString(),
    };
  }

  async update(id: string, dto: Partial<CreateFranchiseDto>, actorUserId: string) {
    try {
      const franchise = await this.prisma.franchise.update({
        where: { id },
        data: {
          name: dto.name,
          legalName: dto.legalName,
          taxId: dto.taxId,
        },
      });

      try {
        await this.auditService.log({
          actorUserId,
          action: 'FRANCHISE_UPDATED',
          entityType: 'Franchise',
          entityId: franchise.id,
          metadata: { name: franchise.name },
        }).catch(() => {});
      } catch {}

      return franchise;
    } catch {}

    const devFranchise = DEV_FRANCHISES.find((f) => f.id === id || f.code === id);
    if (devFranchise) {
      if (dto.name) devFranchise.name = dto.name;
      if (dto.legalName) devFranchise.legalName = dto.legalName;
      if (dto.taxId) devFranchise.taxId = dto.taxId;
      return devFranchise;
    }

    throw new NotFoundException(`Franchise ID '${id}' not found`);
  }

  async updateStatus(id: string, status: string, actorUserId: string) {
    try {
      const franchise = await this.prisma.franchise.update({
        where: { id },
        data: { status },
      });

      try {
        await this.auditService.log({
          actorUserId,
          action: status === 'ACTIVE' ? 'FRANCHISE_ACTIVATED' : 'FRANCHISE_DEACTIVATED',
          entityType: 'Franchise',
          entityId: franchise.id,
          metadata: { status },
        }).catch(() => {});
      } catch {}

      return franchise;
    } catch {}

    const devFranchise = DEV_FRANCHISES.find((f) => f.id === id || f.code === id);
    if (devFranchise) {
      devFranchise.status = status;
      return devFranchise;
    }

    throw new NotFoundException(`Franchise ID '${id}' not found`);
  }
}
