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

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private branchesService: BranchesService,
  ) {}

  async findAllPending() {
    return this.prisma.employeeApprovalRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
            branch: {
              include: {
                franchise: true,
              },
            },
          },
        },
        requestedByUser: {
          select: {
            id: true,
            email: true,
          },
        },
        assignedRole: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async processRequest(id: string, dto: ProcessApprovalDto, approverUserId: string) {
    const request = await this.prisma.employeeApprovalRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        assignedRole: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Approval request ID '${id}' not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Approval request has already been processed (Current status: ${request.status})`);
    }

    // Self-Approval Prevention Check
    if (request.requestedByUserId === approverUserId || request.employee.userId === approverUserId) {
      throw new ForbiddenException(
        'Self-Approval Violation: An employee cannot approve their own account or application request.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.action === ProcessApprovalAction.APPROVE) {
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
            rejectionReason: dto.rejectionReason || 'Application rejected by manager',
          },
        });

        await this.auditService.log({
          actorUserId: approverUserId,
          action: 'EMPLOYEE_REJECTED',
          entityType: 'EmployeeApprovalRequest',
          entityId: id,
          metadata: {
            employeeId: request.employeeId,
            reason: dto.rejectionReason,
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
