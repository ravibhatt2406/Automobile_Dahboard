import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateFollowUpDto } from './dto/create-followup.dto';
import { AuditService } from '../audit/audit.service';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class CrmService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createLead(dto: CreateLeadDto, user: any) {
    const actorUserId = user?.id;
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCustomer = user?.accountType === 'CUSTOMER' || (userRoles.includes('CUSTOMER') && !user?.employeeProfile);

    let branchId = dto.branchId || user?.branchId;
    if (!branchId) {
      throw new BadRequestException('branchId is required to create a lead');
    }

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch '${branchId}' not found`);
    }

    let franchiseId = dto.franchiseId || branch.franchiseId;

    let customerId = dto.customerId;
    if (isCustomer) {
      customerId = user?.customerProfile?.id || user?.customerId;
      if (!customerId) {
        const cust = await this.prisma.customer.findFirst({ where: { userId: actorUserId } });
        if (!cust) throw new ForbiddenException('No customer profile associated with user account');
        customerId = cust.id;
      }
    }

    if (!isSuperAdmin && !isCustomer) {
      if (user?.branchId && user.branchId !== branch.id) {
        throw new ForbiddenException('Cannot create lead for another branch');
      }
      if (user?.franchiseId && user.franchiseId !== branch.franchiseId) {
        throw new ForbiddenException('Cannot create lead for another franchise');
      }
    }

    const lead = await this.prisma.lead.create({
      data: {
        customerId,
        franchiseId,
        branchId: branch.id,
        assignedEmployeeId: dto.assignedEmployeeId || null,
        source: dto.source || 'DIRECT_WALKIN',
        interestedModel: dto.interestedModel,
        expectedBudget: dto.expectedBudget,
        priority: dto.priority || 'MEDIUM',
        notes: dto.notes,
        status: 'NEW',
      },
      include: {
        customer: true,
        branch: true,
        assignedEmployee: true,
      },
    });

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead.id,
      metadata: { customerId: lead.customerId, branchId: lead.branchId },
    }).catch(() => {});

    return lead;
  }

  async findAllLeads(branchId?: string, status?: LeadStatus, limit = 50, offset = 0, user?: any) {
    const where: any = {};
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

    if (!isSuperAdmin) {
      if (user?.branchId) {
        if (branchId && branchId !== user.branchId) {
          throw new ForbiddenException('Cannot access leads from another branch');
        }
        where.branchId = user.branchId;
      } else if (user?.franchiseId) {
        where.franchiseId = user.franchiseId;
        if (branchId) {
          const branchInFranchise = await this.prisma.branch.findFirst({
            where: { id: branchId, franchiseId: user.franchiseId },
          });
          if (!branchInFranchise) {
            throw new ForbiddenException('Branch does not belong to your franchise');
          }
          where.branchId = branchId;
        }
      }
    } else {
      if (branchId) where.branchId = branchId;
    }

    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          branch: true,
          assignedEmployee: true,
          followUps: { orderBy: { scheduledAt: 'asc' } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOneLead(id: string, user?: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        branch: { include: { franchise: true } },
        assignedEmployee: true,
        followUps: { orderBy: { scheduledAt: 'desc' } },
        quotations: true,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead/Enquiry with ID ${id} not found`);
    }

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

      if (!isSuperAdmin) {
        if (user.branchId && lead.branchId !== user.branchId) {
          throw new ForbiddenException('Access denied to lead in another branch');
        }
        if (user.franchiseId && lead.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Access denied to lead in another franchise');
        }
      }
    }

    return lead;
  }

  async assignLead(leadId: string, employeeId: string, user: any) {
    const lead = await this.findOneLead(leadId, user);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ID '${employeeId}' not found`);
    }

    if (employee.branchId !== lead.branchId) {
      throw new BadRequestException('Cannot assign lead to an employee from a different branch');
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        assignedEmployeeId: employeeId,
        status: lead.status === 'NEW' ? 'CONTACTED' : lead.status,
      },
      include: { assignedEmployee: true },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'LEAD_ASSIGNED',
      entityType: 'Lead',
      entityId: leadId,
      metadata: { assignedEmployeeId: employeeId },
    }).catch(() => {});

    return updated;
  }

  async updateLeadStatus(leadId: string, status: LeadStatus, user: any) {
    await this.findOneLead(leadId, user);

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'LEAD_STATUS_UPDATED',
      entityType: 'Lead',
      entityId: leadId,
      metadata: { newStatus: status },
    }).catch(() => {});

    return updated;
  }

  async addFollowUp(leadId: string, dto: CreateFollowUpDto, user: any) {
    const lead = await this.findOneLead(leadId, user);

    let employeeId = user?.id;
    const employee = await this.prisma.employee.findFirst({
      where: { userId: user?.id, branchId: lead.branchId },
    });
    if (employee) {
      employeeId = employee.id;
    } else if (lead.assignedEmployeeId) {
      employeeId = lead.assignedEmployeeId;
    } else {
      const branchEmp = await this.prisma.employee.findFirst({
        where: { branchId: lead.branchId, status: 'ACTIVE' },
      });
      if (branchEmp) employeeId = branchEmp.id;
    }

    return this.prisma.followUp.create({
      data: {
        leadId,
        employeeId: employeeId || lead.assignedEmployeeId,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
        status: 'PENDING',
      },
    });
  }

  async completeFollowUp(followUpId: string, user?: any) {
    const followUp = await this.prisma.followUp.findUnique({
      where: { id: followUpId },
      include: { lead: { include: { branch: true } } },
    });

    if (!followUp) {
      throw new NotFoundException(`FollowUp ID '${followUpId}' not found`);
    }

    if (user && followUp.lead) {
      await this.findOneLead(followUp.lead.id, user);
    }

    return this.prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }
}
