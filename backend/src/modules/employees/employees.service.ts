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

  async create(dto: CreateEmployeeDto, userOrId: any, actorRoles?: string[]) {
    const creatorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const creatorRoles: string[] = typeof userOrId === 'object' ? (userOrId.roles || []) : (actorRoles || []);
    const user = typeof userOrId === 'object' ? userOrId : null;

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

    if (!dto.branchId) {
      throw new BadRequestException('branchId is required');
    }

    const targetBranch = await this.prisma.branch.findFirst({
      where: {
        OR: [{ id: dto.branchId }, { code: dto.branchId }],
      },
      include: { franchise: true },
    });

    if (!targetBranch) {
      throw new NotFoundException(`Branch '${dto.branchId}' not found`);
    }

    // Tenant / Branch Scope Validation
    const isSuperAdmin =
      creatorHighestRank === 1 ||
      user?.accountType === 'SUPER_ADMIN' ||
      creatorRoles.includes('SUPER_ADMIN');

    if (!isSuperAdmin) {
      const isFranchiseLevel = creatorRoles.some((r) =>
        ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r),
      );

      if (isFranchiseLevel) {
        const assignedFranchise = user?.assignedFranchiseId;
        if (assignedFranchise && targetBranch.franchiseId !== assignedFranchise) {
          throw new ForbiddenException(
            'Multi-tenant scope violation: Cannot create employee in another franchise',
          );
        }
      } else {
        // Branch Level (BRANCH_OWNER, BRANCH_MANAGER)
        const assignedBranch = user?.assignedBranchId;
        if (
          assignedBranch &&
          targetBranch.id !== assignedBranch &&
          targetBranch.code !== assignedBranch
        ) {
          throw new ForbiddenException(
            'Multi-tenant scope violation: Cannot create employee in another branch',
          );
        }
      }
    }

    if (targetBranch.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot assign employee to inactive branch '${targetBranch.name}'`);
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, dto.phone ? { phone: dto.phone } : {}] },
    });

    if (existingUser) {
      throw new ConflictException(`User with email/phone '${dto.email}' already exists`);
    }

    return await this.prisma.$transaction(async (tx) => {
      const branchId = targetBranch.id;

      if (dto.roleName === 'BRANCH_MANAGER') {
        await this.branchesService.validateMaxBranchManagersTransaction(tx, branchId);
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const newUser = await tx.user.create({
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
          userId: newUser.id,
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
          id: { notIn: [creatorUserId, newUser.id] },
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

        const candRoles = emp.roleAssignments?.map((ra) => ra.role?.name) || [];
        const permissions = new Set<string>();
        emp.roleAssignments?.forEach((ra) => {
          ra.role?.rolePermissions?.forEach((rp) => {
            if (rp.permission?.name) permissions.add(rp.permission.name);
          });
        });

        const hasApprovePerm = permissions.has('employee.approve');
        const isCandSuperAdmin = cand.accountType === 'SUPER_ADMIN' || candRoles.includes('SUPER_ADMIN');
        if (isCandSuperAdmin) return true;

        const isFranchiseScope = candRoles.includes('FRANCHISE_OWNER') || candRoles.includes('FRANCHISE_MANAGER');
        if (isFranchiseScope || (hasApprovePerm && emp.branch?.franchiseId === targetBranch.franchiseId)) {
          return emp.branch?.franchiseId === targetBranch.franchiseId;
        }

        const isBranchScope = candRoles.includes('BRANCH_OWNER') || candRoles.includes('BRANCH_MANAGER');
        if (isBranchScope || hasApprovePerm) {
          return emp.branchId === branchId;
        }

        return false;
      });

      const approverUsers =
        eligibleApprovers.length > 0
          ? eligibleApprovers
          : candidateUsers.filter(
              (c) => c.accountType === 'SUPER_ADMIN' || c.employeeProfile?.branchId === branchId,
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
              branchId,
              franchiseId: targetBranch.franchiseId,
            },
            status: 'PENDING',
          },
        });
      }

      await this.auditService.log({
        actorUserId: creatorUserId,
        action: 'EMPLOYEE_CREATED',
        entityType: 'Employee',
        entityId: employee.id,
        metadata: { employeeCode: dto.employeeCode, branchId, roleName: dto.roleName },
      }).catch(() => {});

      await this.auditService.log({
        actorUserId: creatorUserId,
        action: 'APPROVAL_REQUESTED',
        entityType: 'EmployeeApprovalRequest',
        entityId: approvalRequest.id,
        metadata: { employeeId: employee.id, assignedRole: targetRole.name },
      }).catch(() => {});

      return {
        message: 'Employee account created successfully and submitted for manager approval',
        employeeId: employee.id,
        approvalRequestId: approvalRequest.id,
        status: employee.status,
      };
    });
  }

  async assignRole(id: string, roleName: string, user: any) {
    const actorUserId = user?.id;
    const roles: string[] = user?.roles || [];
    const creatorHighestRank = Math.min(...roles.map((r) => ROLE_RANKS[r] ?? 99));

    if (creatorHighestRank >= 7) {
      throw new ForbiddenException('Unauthorized: Your role does not have permission to assign roles');
    }

    const targetRoleRank = ROLE_RANKS[roleName] ?? 99;
    if (creatorHighestRank !== 1 && targetRoleRank <= creatorHighestRank) {
      throw new ForbiddenException(
        `Server-side RBAC Violation: You cannot assign a role ('${roleName}' rank ${targetRoleRank}) with equal or higher authority than your rank (${creatorHighestRank}).`,
      );
    }

    const targetRole = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!targetRole) {
      throw new BadRequestException(`Role '${roleName}' does not exist`);
    }

    const employee = await this.findOne(id, user);

    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot assign role to inactive employee '${employee.employeeCode}'`);
    }

    await this.prisma.$transaction(async (tx) => {
      if (roleName === 'BRANCH_MANAGER') {
        await this.branchesService.validateMaxBranchManagersTransaction(tx, employee.branchId, employee.id);
      }

      await tx.employeeRoleAssignment.upsert({
        where: {
          employeeId_roleId: {
            employeeId: employee.id,
            roleId: targetRole.id,
          },
        },
        create: {
          employeeId: employee.id,
          roleId: targetRole.id,
          assignedBy: actorUserId,
        },
        update: {},
      });
    });

    await this.auditService.log({
      actorUserId,
      action: 'ROLE_ASSIGNED',
      entityType: 'Employee',
      entityId: employee.id,
      metadata: { roleName, employeeCode: employee.employeeCode, branchId: employee.branchId },
    }).catch(() => {});

    return this.findOne(id, user);
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
        // Branch Level
        if (
          effectiveBranchId &&
          effectiveBranchId !== user.assignedBranchId &&
          effectiveBranchId !== user.employeeProfile?.branch?.code
        ) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
        }
        effectiveBranchId = user.assignedBranchId;
      }
    } else if (isSuperAdmin && effectiveBranchId && effectiveFranchiseId) {
      const b = await this.prisma.branch.findFirst({
        where: { OR: [{ id: effectiveBranchId }, { code: effectiveBranchId }] },
      });
      if (b && b.franchiseId !== effectiveFranchiseId) {
        throw new BadRequestException('Selected branch does not belong to the selected franchise');
      }
    }

    return this.prisma.employee.findMany({
      where: {
        branchId: effectiveBranchId || undefined,
        branch: effectiveFranchiseId ? { franchiseId: effectiveFranchiseId } : undefined,
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

  async findOne(id: string, user?: any) {
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

    if (user) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
        if (isFranchiseLevel) {
          if (employee.branch?.franchiseId !== user.assignedFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access attempt');
          }
        } else {
          if (employee.branchId !== user.assignedBranchId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access attempt');
          }
        }
      }
    }

    return employee;
  }

  async update(id: string, dto: Partial<CreateEmployeeDto>, actorUserOrId: any) {
    const actorUserId = typeof actorUserOrId === 'object' ? actorUserOrId.id : actorUserOrId;
    const user = typeof actorUserOrId === 'object' ? actorUserOrId : null;

    const employee = await this.findOne(id, user);

    if (dto.branchId && dto.branchId !== employee.branchId) {
      throw new ForbiddenException('Branch transfer is not permitted for employee records');
    }

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

  async deactivate(id: string, actorUserOrId: any) {
    const actorUserId = typeof actorUserOrId === 'object' ? actorUserOrId.id : actorUserOrId;
    const user = typeof actorUserOrId === 'object' ? actorUserOrId : null;

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true, branch: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ID '${id}' not found`);
    }

    if (user) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
        if (isFranchiseLevel) {
          if (employee.branch?.franchiseId !== user.assignedFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access attempt');
          }
        } else {
          if (employee.branchId !== user.assignedBranchId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access attempt');
          }
        }
      }
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
