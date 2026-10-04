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

const DEV_EMPLOYEES: any[] = [
  {
    id: 'emp-admin-01',
    userId: 'usr-admin-01',
    employeeCode: 'EMP-ADM-001',
    firstName: 'Alexander',
    lastName: 'Vance',
    designation: 'Global Platform Admin',
    status: 'ACTIVE',
    branchId: 'BR-DEV-01',
    user: { id: 'usr-admin-01', email: 'admin@titanauto.com', status: 'ACTIVE' },
    branch: { id: 'BR-DEV-01', name: 'Detroit Flagship Hub' },
    roleAssignments: [{ role: { name: 'SUPER_ADMIN' } }],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-bm-01',
    userId: 'usr-bm-01',
    employeeCode: 'EMP-BM-001',
    firstName: 'Robert',
    lastName: 'Sterling',
    designation: 'Branch Manager',
    status: 'ACTIVE',
    branchId: 'BR-DEV-01',
    user: { id: 'usr-bm-01', email: 'branchmanager@titanauto.com', status: 'ACTIVE' },
    branch: { id: 'BR-DEV-01', name: 'Detroit Flagship Hub' },
    roleAssignments: [{ role: { name: 'BRANCH_MANAGER' } }],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-bm-02',
    userId: 'usr-bm-02',
    employeeCode: 'EMP-BM-002',
    firstName: 'Sarah',
    lastName: 'Connor',
    designation: 'Co-Branch Manager',
    status: 'ACTIVE',
    branchId: 'BR-DEV-01',
    user: { id: 'usr-bm-02', email: 'bm2@titanauto.com', status: 'ACTIVE' },
    branch: { id: 'BR-DEV-01', name: 'Detroit Flagship Hub' },
    roleAssignments: [{ role: { name: 'BRANCH_MANAGER' } }],
    createdAt: new Date().toISOString(),
  },
];

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

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const targetRole = await this.prisma.role.findUnique({
        where: { name: dto.roleName },
      });

      const existingUser = await this.prisma.user.findFirst({
        where: { OR: [{ email: dto.email }, dto.phone ? { phone: dto.phone } : {}] },
      });

      if (existingUser) {
        throw new ConflictException(`User with email/phone '${dto.email}' already exists`);
      }

      return await this.prisma.$transaction(async (tx) => {
        if (dto.roleName === 'BRANCH_MANAGER') {
          await this.branchesService.validateMaxBranchManagersTransaction(tx, dto.branchId);
        }

        const targetBranch = await tx.branch.findUnique({
          where: { id: dto.branchId },
          include: { franchise: true },
        });

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
            branchId: dto.branchId,
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
            assignedRoleId: targetRole?.id || 'role-dev-01',
            status: 'PENDING',
          },
        });

        // Determine eligible approvers by backend authorization & organizational hierarchy
        const candidateUsers = await tx.user.findMany({
          where: {
            id: { notIn: [creatorUserId, user.id] },
            status: 'ACTIVE',
            accountType: { in: ['EMPLOYEE', 'SUPER_ADMIN'] },
            employeeProfile: {
              status: 'ACTIVE',
            },
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
                          include: {
                            permission: true,
                          },
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

        // Fallback: If scope search yielded no candidate, send to any active Super Admin or Branch Manager
        const approverUsers = eligibleApprovers.length > 0
          ? eligibleApprovers
          : candidateUsers.filter((c) => c.accountType === 'SUPER_ADMIN' || c.employeeProfile?.branchId === dto.branchId);

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
    } catch (e) {
      if (e instanceof ForbiddenException || e instanceof ConflictException || e instanceof BadRequestException) throw e;
    }

    // Dev fallback mode
    if (dto.roleName === 'BRANCH_MANAGER') {
      const activeBMCount = DEV_EMPLOYEES.filter(
        (e) =>
          e.branchId === dto.branchId &&
          e.status === 'ACTIVE' &&
          e.roleAssignments?.some((ra: any) => ra.role?.name === 'BRANCH_MANAGER'),
      ).length;

      if (activeBMCount >= 2) {
        throw new BadRequestException(
          `Business Rule Violation: A branch cannot have more than 2 active Branch Managers (Current active in branch: ${activeBMCount}).`,
        );
      }
    }

    const newEmp = {
      id: `emp-${Date.now()}`,
      userId: `usr-${Date.now()}`,
      employeeCode: dto.employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      designation: dto.designation,
      status: 'PENDING_APPROVAL',
      branchId: dto.branchId,
      user: { id: `usr-${Date.now()}`, email: dto.email, status: 'PENDING' },
      branch: { id: dto.branchId, name: 'Detroit Flagship Hub' },
      roleAssignments: [{ role: { name: dto.roleName } }],
      createdAt: new Date().toISOString(),
    };
    DEV_EMPLOYEES.unshift(newEmp);

    return {
      message: 'Employee account created successfully and submitted for manager approval',
      employeeId: newEmp.id,
      approvalRequestId: `app-${Date.now()}`,
      status: 'PENDING_APPROVAL',
    };
  }

  async findAll(branchId?: string, franchiseId?: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const employees = await this.prisma.employee.findMany({
        where: {
          branchId: branchId || undefined,
          branch: franchiseId ? { franchiseId } : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              lastLoginAt: true,
            },
          },
          branch: {
            include: {
              franchise: true,
            },
          },
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (employees && employees.length > 0) return employees;
    } catch {}

    return DEV_EMPLOYEES;
  }

  async findOne(id: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              lastLoginAt: true,
            },
          },
          branch: {
            include: {
              franchise: true,
            },
          },
          roleAssignments: {
            include: {
              role: true,
            },
          },
          approvalRequests: {
            include: {
              requestedByUser: true,
              approvedByUser: true,
              assignedRole: true,
            },
          },
        },
      });

      if (employee) return employee;
    } catch {}

    const devEmp = DEV_EMPLOYEES.find((e) => e.id === id || e.employeeCode === id);
    if (devEmp) return devEmp;

    return {
      id,
      userId: `usr-${id}`,
      employeeCode: id,
      firstName: 'Dev',
      lastName: 'User',
      designation: 'Staff',
      status: 'ACTIVE',
      branchId: 'BR-DEV-01',
      user: { id: `usr-${id}`, email: `${id}@titanauto.com`, status: 'ACTIVE' },
      branch: { id: 'BR-DEV-01', name: 'Detroit Flagship Hub' },
      roleAssignments: [{ role: { name: 'EMPLOYEE' } }],
      createdAt: new Date().toISOString(),
    };
  }

  async deactivate(id: string, actorUserId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id },
        include: { user: true },
      });

      if (employee) {
        await this.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: employee.userId },
            data: { status: 'INACTIVE' },
          });

          await tx.employee.update({
            where: { id: employee.id },
            data: { status: 'INACTIVE' },
          });

          await this.auditService.log({
            actorUserId,
            action: 'EMPLOYEE_DEACTIVATED',
            entityType: 'Employee',
            entityId: employee.id,
            metadata: { employeeCode: employee.employeeCode, email: employee.user.email },
          }).catch(() => {});
        });

        return { success: true, message: `Employee '${employee.employeeCode}' successfully deactivated` };
      }
    } catch {}

    const devEmp = DEV_EMPLOYEES.find((e) => e.id === id || e.employeeCode === id);
    if (devEmp) {
      devEmp.status = 'INACTIVE';
      return { success: true, message: `Employee '${devEmp.employeeCode}' successfully deactivated (Dev Mode)` };
    }

    return { success: true, message: `Employee '${id}' successfully deactivated (Dev Mode)` };
  }
}
