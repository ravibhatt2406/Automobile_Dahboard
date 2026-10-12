import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

  async findAll(user?: any) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');

    if (user && !isSuperAdmin) {
      if (!user.assignedFranchiseId) {
        throw new ForbiddenException('Multi-tenant scope violation: No assigned franchise for user');
      }
      return this.prisma.franchise.findMany({
        where: { id: user.assignedFranchiseId },
        include: { branches: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.franchise.findMany({
      include: { branches: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user?: any) {
    const franchise = await this.prisma.franchise.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
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

    if (user) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        if (
          franchise.id !== user.assignedFranchiseId &&
          franchise.code !== user.assignedFranchiseId
        ) {
          throw new ForbiddenException(
            'Multi-tenant scope violation: Unauthorized franchise access attempt',
          );
        }
      }
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
