import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { AuditService } from '../audit/audit.service';
import { BranchesService } from '../branches/branches.service';
import * as bcrypt from 'bcrypt';
import { ROLE_RANKS } from '@/common/constants/permissions.constant';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private branchesService: BranchesService,
  ) {}

  async create(dto: CreateEmployeeDto, creatorUserId: string, creatorRoles: string[]) {
    const creatorHighestRank = Math.min(...creatorRoles.map((r) => ROLE_RANKS[r] ?? 99));

    if (creatorHighestRank >= 7) {
      throw new ForbiddenException('Unauthorized: Your role does not have permission to create employees');
    }

    const targetRoleRank = ROLE_RANKS[dto.roleName] ?? 99;
    if (creatorHighestRank !== 1 && targetRoleRank <= creatorHighestRank) {
      throw new ForbiddenException(
        `Server-side RBAC Violation: You cannot create or assign a role ('${dto.roleName}' rank ${targetRoleRank}) with equal or higher authority than your rank (${creatorHighestRank}).`,
      );
    }

    const targetRole = await this.prisma.role.findUnique({
      where: { name: dto.roleName },
    });

    if (!targetRole) {
      throw new BadRequestException(`Role '${dto.roleName}' does not exist`);
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, dto.phone ? { phone: dto.phone } : {}] },
    });

    if (existingUser) {
      throw new ConflictException(`User with email/phone '${dto.email}' already exists`);
    }

    return await this.prisma.$transaction(async (tx) => {
      let targetBranch = await tx.branch.findFirst({
        where: {
          OR: [{ id: dto.branchId }, { code: dto.branchId }],
        },
        include: { franchise: true },
      });

      if (!targetBranch) {
        targetBranch = await tx.branch.findFirst({
          where: { status: 'ACTIVE' },
          include: { franchise: true },
        });
      }

      if (!targetBranch) {
        throw new NotFoundException(`No active branch found for assignment`);
      }

      const branchId = targetBranch.id;

      if (dto.roleName === 'BRANCH_MANAGER') {
        await this.branchesService.validateMaxBranchManagersTransaction(tx, branchId);
      }

      if (targetBranch.status !== 'ACTIVE') {
        throw new BadRequestException(`Cannot assign employee to inactive branch '${targetBranch.name}'`);
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          accountType: 'EMPLOYEE',
          status: 'PENDING',
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          branchId,
          employeeCode: dto.employeeCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          designation: dto.designation,
          status: 'PENDING_APPROVAL',
        },
      });

      const approvalRequest = await tx.employeeApprovalRequest.create({
        data: {
          employeeId: employee.id,
          requestedByUserId: creatorUserId,
          assignedRoleId: targetRole.id,
          status: 'PENDING',
        },
      });

      // Determine eligible approvers by backend authorization & organizational hierarchy
      const candidateUsers = await tx.user.findMany({
        where: {
          id: { notIn: [creatorUserId, user.id] },
          status: 'ACTIVE',
          accountType: { in: ['EMPLOYEE', 'SUPER_ADMIN'] },
          employeeProfile: { status: 'ACTIVE' },
        },
        include: {
          employeeProfile: {
            include: {
              branch: true,
              roleAssignments: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: { permission: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const eligibleApprovers = candidateUsers.filter((cand) => {
        const emp = cand.employeeProfile;
        if (!emp) return cand.accountType === 'SUPER_ADMIN';

        const roles = emp.roleAssignments?.map((ra) => ra.role?.name) || [];
        const permissions = new Set<string>();
        emp.roleAssignments?.forEach((ra) => {
          ra.role?.rolePermissions?.forEach((rp) => {
            if (rp.permission?.name) permissions.add(rp.permission.name);
          });
        });

        const hasApprovePerm = permissions.has('employee.approve');
        const isSuperAdmin = cand.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
        if (isSuperAdmin) return true;

        const isFranchiseScope = roles.includes('FRANCHISE_OWNER') || roles.includes('FRANCHISE_MANAGER');
        if (isFranchiseScope || (hasApprovePerm && emp.branch?.franchiseId === targetBranch?.franchiseId)) {
          return emp.branch?.franchiseId === targetBranch?.franchiseId;
        }

        const isBranchScope = roles.includes('BRANCH_OWNER') || roles.includes('BRANCH_MANAGER');
        if (isBranchScope || hasApprovePerm) {
          return emp.branchId === dto.branchId;
        }

        return false;
      });

      const approverUsers =
        eligibleApprovers.length > 0
          ? eligibleApprovers
          : candidateUsers.filter(
              (c) => c.accountType === 'SUPER_ADMIN' || c.employeeProfile?.branchId === dto.branchId,
            );

      for (const approver of approverUsers) {
        await tx.notification.create({
          data: {
            userId: approver.id,
            channel: 'IN_APP',
            title: 'Employee Approval Required',
            body: `New employee ${dto.firstName} ${dto.lastName} is waiting for approval.`,
            metadata: {
              type: 'EMPLOYEE_APPROVAL',
              approvalRequestId: approvalRequest.id,
              employeeId: employee.id,
              branchId: dto.branchId,
              franchiseId: targetBranch?.franchiseId,
            },
            status: 'PENDING',
          },
        });
      }

      return {
        message: 'Employee account created successfully and submitted for manager approval',
        employeeId: employee.id,
        approvalRequestId: approvalRequest.id,
        status: employee.status,
      };
    });
  }

  async findAll(branchId?: string, franchiseId?: string) {
    return this.prisma.employee.findMany({
      where: {
        branchId: branchId || undefined,
        branch: franchiseId ? { franchiseId } : undefined,
      },
      include: {
        user: {
          select: { id: true, email: true, phone: true, status: true, lastLoginAt: true },
        },
        branch: { include: { franchise: true } },
        roleAssignments: { include: { role: true } },
        approvalRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { assignedRole: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, phone: true, status: true, lastLoginAt: true },
        },
        branch: { include: { franchise: true } },
        roleAssignments: { include: { role: true } },
        approvalRequests: {
          include: {
            requestedByUser: true,
            approvedByUser: true,
            assignedRole: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ID '${id}' not found`);
    }

    return employee;
  }

  async update(id: string, dto: Partial<CreateEmployeeDto>, actorUserId: string) {
    const employee = await this.findOne(id);

    const updated = await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        designation: dto.designation,
      },
      include: {
        user: { select: { id: true, email: true, phone: true, status: true } },
        branch: { include: { franchise: true } },
        roleAssignments: { include: { role: true } },
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'Employee',
      entityId: id,
      metadata: { employeeCode: employee.employeeCode },
    }).catch(() => {});

    return updated;
  }

  async deactivate(id: string, actorUserId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ID '${id}' not found`);
    }

    if (employee.status === 'INACTIVE' || employee.status === 'TERMINATED') {
      throw new BadRequestException(`Employee '${employee.employeeCode}' is already deactivated`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: employee.userId },
        data: { status: 'INACTIVE' },
      });

      await tx.employee.update({
        where: { id: employee.id },
        data: { status: 'INACTIVE' },
      });
    });

    await this.auditService.log({
      actorUserId,
      action: 'EMPLOYEE_DEACTIVATED',
      entityType: 'Employee',
      entityId: employee.id,
      metadata: { employeeCode: employee.employeeCode, email: employee.user.email },
    }).catch(() => {});

    return { success: true, message: `Employee '${employee.employeeCode}' successfully deactivated` };
  }
}
