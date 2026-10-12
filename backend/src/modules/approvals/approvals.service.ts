import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ProcessApprovalDto, ProcessApprovalAction } from './dto/process-approval.dto';
import { AuditService } from '../audit/audit.service';
import { BranchesService } from '../branches/branches.service';
import { ROLE_RANKS } from '@/common/constants/permissions.constant';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private branchesService: BranchesService,
  ) {}

  async findAllPending(user?: any) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));

    const where: any = { status: 'PENDING' };
    if (user && !isSuperAdmin) {
      if (isFranchiseLevel) {
        where.employee = { branch: { franchiseId: user.assignedFranchiseId } };
      } else {
        where.employee = { branchId: user.assignedBranchId };
      }
    }

    return this.prisma.employeeApprovalRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: { id: true, email: true, phone: true },
            },
            branch: { include: { franchise: true } },
          },
        },
        requestedByUser: {
          select: { id: true, email: true },
        },
        assignedRole: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAll(branchId?: string, franchiseId?: string, user?: any) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));

    let effectiveBranchId = branchId;
    let effectiveFranchiseId = franchiseId;

    if (user && !isSuperAdmin) {
      if (isFranchiseLevel) {
        if (effectiveFranchiseId && effectiveFranchiseId !== user.assignedFranchiseId) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access');
        }
        effectiveFranchiseId = user.assignedFranchiseId;
        if (effectiveBranchId) {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: effectiveBranchId }, { code: effectiveBranchId }] },
          });
          if (!b || b.franchiseId !== user.assignedFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
          }
          effectiveBranchId = b.id;
        }
      } else {
        if (
          effectiveBranchId &&
          effectiveBranchId !== user.assignedBranchId &&
          effectiveBranchId !== user.employeeProfile?.branch?.code
        ) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
        }
        effectiveBranchId = user.assignedBranchId;
      }
    }

    const where: any = {};
    if (effectiveBranchId) {
      where.employee = { branchId: effectiveBranchId };
    } else if (effectiveFranchiseId) {
      where.employee = { branch: { franchiseId: effectiveFranchiseId } };
    }

    return this.prisma.employeeApprovalRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true, phone: true } },
            branch: { include: { franchise: true } },
          },
        },
        requestedByUser: { select: { id: true, email: true } },
        approvedByUser: { select: { id: true, email: true } },
        assignedRole: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user?: any) {
    const request = await this.prisma.employeeApprovalRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
            branch: { include: { franchise: true } },
          },
        },
        requestedByUser: { select: { id: true, email: true } },
        approvedByUser: { select: { id: true, email: true } },
        assignedRole: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Approval request ID '${id}' not found`);
    }

    if (user) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
        if (isFranchiseLevel) {
          if (request.employee.branch?.franchiseId !== user.assignedFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access attempt');
          }
        } else {
          if (request.employee.branchId !== user.assignedBranchId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access attempt');
          }
        }
      }
    }

    return request;
  }

  async processRequest(id: string, dto: ProcessApprovalDto, userOrId: any) {
    const approverUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;

    const action =
      dto.action ||
      (dto.status === 'APPROVED'
        ? ProcessApprovalAction.APPROVE
        : dto.status === 'REJECTED'
        ? ProcessApprovalAction.REJECT
        : ProcessApprovalAction.APPROVE);

    const rejectionReason = dto.rejectionReason || dto.comments;

    const request = await this.prisma.employeeApprovalRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
            branch: { include: { franchise: true } },
          },
        },
        assignedRole: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Approval request ID '${id}' not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Approval request has already been processed (Current status: ${request.status})`,
      );
    }

    // Backend Authorization & Scope Check
    const approverUser = await this.prisma.user.findUnique({
      where: { id: approverUserId },
      include: {
        employeeProfile: {
          include: {
            branch: true,
            roleAssignments: {
              include: {
                role: {
                  include: {
                    rolePermissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const isSuperAdmin =
      approverUser?.accountType === 'SUPER_ADMIN' ||
      approverUser?.employeeProfile?.roleAssignments?.some(
        (ra) => ra.role.name === 'SUPER_ADMIN',
      );

    // Self-Approval Prevention Check
    if (request.employee.userId === approverUserId) {
      throw new ForbiddenException(
        'Self-Approval Violation: An employee cannot approve their own account or application request.',
      );
    }

    if (request.requestedByUserId === approverUserId && !isSuperAdmin) {
      throw new ForbiddenException(
        'Self-Approval Violation: An employee cannot approve their own account or application request.',
      );
    }

    if (approverUser && !isSuperAdmin) {
      const emp = approverUser.employeeProfile;
      const roles = emp?.roleAssignments?.map((ra) => ra.role?.name) || [];
      const isSuperAdminRole = roles.includes('SUPER_ADMIN');

      if (!isSuperAdminRole) {
        const isFranchiseScope = roles.includes('FRANCHISE_OWNER') || roles.includes('FRANCHISE_MANAGER');
        const isBranchScope = roles.includes('BRANCH_OWNER') || roles.includes('BRANCH_MANAGER');

        const hasSameBranch = emp?.branchId === request.employee.branchId;
        const hasSameFranchise = emp?.branch?.franchiseId === request.employee.branch.franchiseId;

        if (isBranchScope && !hasSameBranch) {
          throw new ForbiddenException(
            'Authorization Violation: Branch managers cannot process approval requests outside their assigned branch.',
          );
        }

        if (isFranchiseScope && !hasSameFranchise) {
          throw new ForbiddenException(
            'Authorization Violation: Franchise managers cannot process approval requests outside their franchise.',
          );
        }

        const approverHighestRank = Math.min(...roles.map((r) => ROLE_RANKS[r] ?? 99));
        const targetRoleRank = ROLE_RANKS[request.assignedRole.name] ?? 99;
        if (approverHighestRank !== 1 && targetRoleRank <= approverHighestRank) {
          throw new ForbiddenException(
            `Server-side RBAC Violation: You cannot approve or assign a role ('${request.assignedRole.name}' rank ${targetRoleRank}) with equal or higher authority than your rank (${approverHighestRank}).`,
          );
        }
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      if (action === ProcessApprovalAction.APPROVE) {
        // Enforce max 2 Branch Managers if approving Branch Manager role
        if (request.assignedRole.name === 'BRANCH_MANAGER') {
          await this.branchesService.validateMaxBranchManagersTransaction(
            tx,
            request.employee.branchId,
          );
        }

        // 1. Assign Role to Employee
        await tx.employeeRoleAssignment.upsert({
          where: {
            employeeId_roleId: {
              employeeId: request.employeeId,
              roleId: request.assignedRoleId,
            },
          },
          create: {
            employeeId: request.employeeId,
            roleId: request.assignedRoleId,
            assignedBy: approverUserId,
          },
          update: {},
        });

        // 2. Activate Employee profile
        await tx.employee.update({
          where: { id: request.employeeId },
          data: { status: 'ACTIVE' },
        });

        // 3. Activate User identity
        await tx.user.update({
          where: { id: request.employee.userId },
          data: { status: 'ACTIVE' },
        });

        // 4. Update Approval Request
        const updatedRequest = await tx.employeeApprovalRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedByUserId: approverUserId,
          },
        });

        // 5. Mark associated notifications as READ
        await tx.notification.updateMany({
          where: {
            status: { not: 'READ' },
          },
          data: { status: 'READ' },
        }).catch(() => {});

        await this.auditService.log({
          actorUserId: approverUserId,
          action: 'EMPLOYEE_APPROVED',
          entityType: 'EmployeeApprovalRequest',
          entityId: id,
          metadata: {
            employeeId: request.employeeId,
            assignedRole: request.assignedRole.name,
          },
        });

        await this.auditService.log({
          actorUserId: approverUserId,
          action: 'ROLE_ASSIGNED',
          entityType: 'Employee',
          entityId: request.employeeId,
          metadata: {
            roleName: request.assignedRole.name,
            employeeId: request.employeeId,
          },
        }).catch(() => {});

        return {
          message: `Employee onboarding request approved successfully. Role '${request.assignedRole.name}' assigned.`,
          request: updatedRequest,
        };
      } else {
        // REJECT Workflow
        await tx.employee.update({
          where: { id: request.employeeId },
          data: { status: 'INACTIVE' },
        });

        await tx.user.update({
          where: { id: request.employee.userId },
          data: { status: 'INACTIVE' },
        });

        const updatedRequest = await tx.employeeApprovalRequest.update({
          where: { id },
          data: {
            status: 'REJECTED',
            approvedByUserId: approverUserId,
            rejectionReason: rejectionReason || 'Application rejected by manager',
          },
        });

        await this.auditService.log({
          actorUserId: approverUserId,
          action: 'EMPLOYEE_REJECTED',
          entityType: 'EmployeeApprovalRequest',
          entityId: id,
          metadata: {
            employeeId: request.employeeId,
            reason: rejectionReason,
          },
        });

        return {
          message: 'Employee onboarding request rejected',
          request: updatedRequest,
        };
      }
    });
  }
}
