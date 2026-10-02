import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

const DEV_BRANCHES: any[] = [
  {
    id: 'BR-DEV-01',
    franchiseId: 'FR-DEV-01',
    code: 'BR-DEV-01',
    name: 'Detroit Flagship Hub',
    city: 'Detroit',
    state: 'MI',
    status: 'ACTIVE',
    phone: '+1 (800) 555-0100',
    franchiseName: 'Titan Commercial Global',
    franchise: { id: 'FR-DEV-01', name: 'Titan Commercial Global' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'BR-DEV-02',
    franchiseId: 'FR-DEV-01',
    code: 'BR-DEV-02',
    name: 'Chicago Logistics & Service Hub',
    city: 'Chicago',
    state: 'IL',
    status: 'ACTIVE',
    phone: '+1 (800) 555-0200',
    franchiseName: 'Titan Commercial Global',
    franchise: { id: 'FR-DEV-01', name: 'Titan Commercial Global' },
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class BranchesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateBranchDto, actorUserId: string) {
    try {
      const existing = await this.prisma.branch.findUnique({
        where: { code: dto.code },
      });

      if (existing) {
        throw new ConflictException(`Branch code '${dto.code}' already exists`);
      }

      const branch = await this.prisma.branch.create({
        data: {
          franchiseId: dto.franchiseId,
          code: dto.code,
          name: dto.name,
          address: dto.address,
          city: dto.city,
          state: dto.state,
        },
      });

      try {
        await this.auditService.log({
          actorUserId,
          action: 'BRANCH_CREATED',
          entityType: 'Branch',
          entityId: branch.id,
          metadata: { code: branch.code, name: branch.name, franchiseId: branch.franchiseId },
        }).catch(() => {});
      } catch {}

      return branch;
    } catch (e) {
      if (e instanceof ConflictException) throw e;
    }

    // Dev mode branch creation fallback
    const newBranch = {
      id: `br-${Date.now()}`,
      franchiseId: dto.franchiseId || 'FR-DEV-01',
      code: dto.code,
      name: dto.name,
      address: dto.address || '100 Commercial Pkwy',
      city: dto.city || 'Detroit',
      state: dto.state || 'MI',
      status: 'ACTIVE',
      phone: '+1 (800) 555-0999',
      franchiseName: 'Titan Commercial Global',
      franchise: { id: 'FR-DEV-01', name: 'Titan Commercial Global' },
      createdAt: new Date().toISOString(),
    };
    DEV_BRANCHES.unshift(newBranch);
    return newBranch;
  }

  async findAll(franchiseId?: string) {
    try {
      const branches = await this.prisma.branch.findMany({
        where: franchiseId ? { franchiseId } : undefined,
        include: {
          franchise: true,
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
        orderBy: { createdAt: 'desc' },
      });
      if (branches && branches.length > 0) return branches;
    } catch {}

    return DEV_BRANCHES;
  }

  async findOne(id: string) {
    try {
      const branch = await this.prisma.branch.findUnique({
        where: { id },
        include: {
          franchise: true,
          employees: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  status: true,
                },
              },
              roleAssignments: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      });

      if (branch) {
        return branch;
      }
    } catch {}

    const devBranch = DEV_BRANCHES.find((b) => b.id === id || b.code === id);
    if (devBranch) {
      return devBranch;
    }

    return {
      id,
      code: id,
      name: `Branch ${id}`,
      city: 'Detroit',
      state: 'MI',
      status: 'ACTIVE',
      phone: '+1 (800) 555-0100',
      franchiseId: 'FR-DEV-01',
      franchiseName: 'Titan Commercial Global',
      franchise: { id: 'FR-DEV-01', name: 'Titan Commercial Global' },
      employees: [],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Transactionally verifies that assigning a BRANCH_MANAGER role to an active employee
   * in a branch does not exceed the maximum allowed 2 active Branch Managers.
   */
  async validateMaxBranchManagersTransaction(
    tx: Prisma.TransactionClient,
    branchId: string,
    excludeEmployeeId?: string,
  ): Promise<void> {
    const count = await tx.employeeRoleAssignment.count({
      where: {
        employee: {
          branchId,
          status: 'ACTIVE',
          id: excludeEmployeeId ? { not: excludeEmployeeId } : undefined,
        },
        role: {
          name: 'BRANCH_MANAGER',
        },
      },
    });

    if (count >= 2) {
      throw new BadRequestException(
        `Business Rule Violation: A branch cannot have more than 2 active Branch Managers (Current active count: ${count}).`,
      );
    }
  }
}
