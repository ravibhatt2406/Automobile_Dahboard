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

  private enrichFranchise(franchise: any, extra?: any) {
    if (!franchise) return null;

    const branches = franchise.branches || [];
    let derivedOwnerName: string | null = null;
    let derivedEmail: string | null = null;
    let derivedPhone: string | null = null;
    let derivedAddress: string | null = null;

    // Search across branch employees for FRANCHISE_OWNER / FRANCHISE_MANAGER
    for (const b of branches) {
      if (!derivedAddress && b.address) {
        const parts = [b.address, b.city, b.state].filter(Boolean);
        derivedAddress = parts.join(', ');
      }
      if (b.employees && Array.isArray(b.employees)) {
        for (const emp of b.employees) {
          const roles = emp.roleAssignments?.map((ra: any) => ra.role?.name) || [];
          if (roles.includes('FRANCHISE_OWNER') || roles.includes('FRANCHISE_MANAGER')) {
            derivedOwnerName =
              `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
              emp.user?.name ||
              null;
            derivedEmail = emp.user?.email || null;
            derivedPhone = emp.user?.phone || null;
            break;
          }
        }
      }
      if (derivedOwnerName) break;
    }

    const brand =
      extra?.brand ||
      (franchise.name.includes('Tata')
        ? 'Tata Motors'
        : franchise.name.includes('Ashok')
        ? 'Ashok Leyland'
        : franchise.name.split(' ')[0] || franchise.name);

    return {
      id: franchise.id,
      code: franchise.code,
      name: franchise.name,
      legalName: franchise.legalName,
      taxId: franchise.taxId,
      status: (franchise.status || 'ACTIVE').toLowerCase(),
      createdAt: franchise.createdAt,
      updatedAt: franchise.updatedAt,
      brand: brand,
      ownerName: extra?.ownerName || derivedOwnerName || null,
      contactEmail: extra?.contactEmail || derivedEmail || null,
      contactPhone: extra?.contactPhone || derivedPhone || null,
      address: extra?.address || derivedAddress || null,
      totalBranches: branches.length,
      branches: branches.map((b: any) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        franchiseId: b.franchiseId,
        franchiseName: franchise.name,
        address: b.address || '',
        city: b.city || '',
        state: b.state || '',
        phone: b.phone || '',
        email: b.email || '',
        status: (b.status || 'ACTIVE').toUpperCase(),
        createdAt: b.createdAt,
      })),
    };
  }

  async create(dto: CreateFranchiseDto, actorUserId: string) {
    const cleanCode = dto.code.trim().toUpperCase();
    const existing = await this.prisma.franchise.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      throw new ConflictException(`Franchise code '${cleanCode}' already exists`);
    }

    const franchise = await this.prisma.franchise.create({
      data: {
        code: cleanCode,
        name: dto.name.trim(),
        legalName: dto.legalName?.trim() || (dto.brand ? `${dto.brand} Dealership Network Ltd` : null),
        taxId: dto.taxId?.trim() || null,
        status: (dto.status || 'ACTIVE').toUpperCase(),
      },
      include: {
        branches: {
          include: {
            employees: {
              include: {
                user: true,
                roleAssignments: { include: { role: true } },
              },
            },
          },
        },
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'FRANCHISE_CREATED',
      entityType: 'Franchise',
      entityId: franchise.id,
      metadata: { code: franchise.code, name: franchise.name },
    }).catch(() => {});

    return this.enrichFranchise(franchise, dto);
  }

  async findAll(user?: any) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');

    const branchInclude = {
      branches: {
        include: {
          employees: {
            include: {
              user: true,
              roleAssignments: { include: { role: true } },
            },
          },
        },
      },
    };

    let franchises: any[] = [];
    if (user && !isSuperAdmin) {
      if (!user.assignedFranchiseId) {
        throw new ForbiddenException('Multi-tenant scope violation: No assigned franchise for user');
      }
      franchises = await this.prisma.franchise.findMany({
        where: { id: user.assignedFranchiseId },
        include: branchInclude,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      franchises = await this.prisma.franchise.findMany({
        include: branchInclude,
        orderBy: { createdAt: 'desc' },
      });
    }

    return franchises.map((f) => this.enrichFranchise(f));
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
                user: true,
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

    return this.enrichFranchise(franchise);
  }

  async update(id: string, dto: Partial<CreateFranchiseDto>, actorUserId: string) {
    const existing = await this.prisma.franchise.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!existing) {
      throw new NotFoundException(`Franchise '${id}' not found`);
    }

    const dataToUpdate: any = {};
    if (dto.name) dataToUpdate.name = dto.name.trim();
    if (dto.legalName !== undefined) dataToUpdate.legalName = dto.legalName ? dto.legalName.trim() : null;
    if (dto.taxId !== undefined) dataToUpdate.taxId = dto.taxId ? dto.taxId.trim() : null;
    if (dto.status) dataToUpdate.status = dto.status.toUpperCase();

    const franchise = await this.prisma.franchise.update({
      where: { id: existing.id },
      data: dataToUpdate,
      include: {
        branches: {
          include: {
            employees: {
              include: {
                user: true,
                roleAssignments: { include: { role: true } },
              },
            },
          },
        },
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'FRANCHISE_UPDATED',
      entityType: 'Franchise',
      entityId: franchise.id,
      metadata: { name: franchise.name },
    }).catch(() => {});

    return this.enrichFranchise(franchise, dto);
  }

  async updateStatus(id: string, status: string, actorUserId: string) {
    const existing = await this.prisma.franchise.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!existing) {
      throw new NotFoundException(`Franchise '${id}' not found`);
    }

    const franchise = await this.prisma.franchise.update({
      where: { id: existing.id },
      data: { status: status.toUpperCase() },
      include: {
        branches: {
          include: {
            employees: {
              include: {
                user: true,
                roleAssignments: { include: { role: true } },
              },
            },
          },
        },
      },
    });

    await this.auditService.log({
      actorUserId,
      action: status.toUpperCase() === 'ACTIVE' ? 'FRANCHISE_ACTIVATED' : 'FRANCHISE_DEACTIVATED',
      entityType: 'Franchise',
      entityId: franchise.id,
      metadata: { status },
    }).catch(() => {});

    return this.enrichFranchise(franchise);
  }
}
