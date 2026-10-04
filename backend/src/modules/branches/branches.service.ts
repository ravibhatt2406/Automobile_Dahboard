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

@Injectable()
export class BranchesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateBranchDto, actorUserId: string) {
    const existing = await this.prisma.branch.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Branch code '${dto.code}' already exists`);
    }

    let targetFranchiseId = dto.franchiseId;
    let franchise = await this.prisma.franchise.findFirst({
      where: {
        OR: [{ id: targetFranchiseId }, { code: targetFranchiseId }],
      },
    });

    if (!franchise) {
      franchise = await this.prisma.franchise.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (!franchise) {
        throw new NotFoundException('No active franchise found to associate the branch with');
      }
    }
    targetFranchiseId = franchise.id;

    const branch = await this.prisma.branch.create({
      data: {
        franchiseId: targetFranchiseId,
        code: dto.code,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state,
      },
      include: { franchise: true },
    });

    await this.auditService.log({
      actorUserId,
      action: 'BRANCH_CREATED',
      entityType: 'Branch',
      entityId: branch.id,
      metadata: { code: branch.code, name: branch.name, franchiseId: branch.franchiseId },
    }).catch(() => {});

    return branch;
  }

  async findAll(franchiseId?: string) {
    return this.prisma.branch.findMany({
      where: franchiseId ? { franchiseId } : undefined,
      include: {
        franchise: true,
        employees: {
          include: {
            roleAssignments: {
              include: { role: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        franchise: true,
        employees: {
          include: {
            user: {
              select: { id: true, email: true, status: true },
            },
            roleAssignments: {
              include: { role: true },
            },
            approvalRequests: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ID '${id}' not found`);
    }

    return branch;
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
        role: { name: 'BRANCH_MANAGER' },
      },
    });

    if (count >= 2) {
      throw new BadRequestException(
        `Business Rule Violation: A branch cannot have more than 2 active Branch Managers (Current active count: ${count}).`,
      );
    }
  }

  async update(id: string, dto: Partial<CreateBranchDto>, actorUserId: string) {
    const branch = await this.prisma.branch.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state,
      },
      include: { franchise: true },
    });

    await this.auditService.log({
      actorUserId,
      action: 'BRANCH_UPDATED',
      entityType: 'Branch',
      entityId: branch.id,
      metadata: { name: branch.name },
    }).catch(() => {});

    return branch;
  }

  async updateStatus(id: string, status: string, actorUserId: string) {
    // Check for dependent records before deactivating
    if (status === 'INACTIVE') {
      const branch = await this.prisma.branch.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              employees: { where: { status: 'ACTIVE' } },
              vehicles: { where: { status: { notIn: ['SOLD', 'DELIVERED'] } } },
            },
          },
        },
      });

      if (!branch) {
        throw new NotFoundException(`Branch ID '${id}' not found`);
      }
    }

    const updated = await this.prisma.branch.update({
      where: { id },
      data: { status },
      include: { franchise: true },
    });

    await this.auditService.log({
      actorUserId,
      action: status === 'ACTIVE' ? 'BRANCH_ACTIVATED' : 'BRANCH_DEACTIVATED',
      entityType: 'Branch',
      entityId: updated.id,
      metadata: { status },
    }).catch(() => {});

    return updated;
  }

  async delete(id: string, actorUserId: string) {
    // Check all dependent records
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            vehicles: true,
            quotations: true,
            bookings: true,
            invoices: true,
            serviceJobs: true,
            serviceAppointments: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ID '${id}' not found`);
    }

    const counts = branch._count;
    const hasHistory =
      counts.employees > 0 ||
      counts.vehicles > 0 ||
      counts.quotations > 0 ||
      counts.bookings > 0 ||
      counts.invoices > 0 ||
      counts.serviceJobs > 0 ||
      counts.serviceAppointments > 0;

    if (hasHistory) {
      throw new BadRequestException(
        'Cannot delete branch with existing records. Use Deactivate instead to preserve historical data.',
      );
    }

    await this.prisma.branch.delete({ where: { id } });

    await this.auditService.log({
      actorUserId,
      action: 'BRANCH_DELETED',
      entityType: 'Branch',
      entityId: id,
      metadata: { branchCode: branch.code, branchName: branch.name },
    }).catch(() => {});

    return { success: true, message: `Branch '${branch.name}' deleted successfully` };
  }
}
