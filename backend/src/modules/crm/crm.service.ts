import { Injectable, NotFoundException } from '@nestjs/common';
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

  async createLead(dto: CreateLeadDto, actorUserId: string) {
    let franchiseId = dto.franchiseId;
    let branchId = dto.branchId;

    if (!branchId) {
      const firstBranch = await this.prisma.branch.findFirst();
      if (firstBranch) {
        branchId = firstBranch.id;
        franchiseId = franchiseId || firstBranch.franchiseId;
      }
    }

    if (!franchiseId && branchId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
      if (branch) {
        franchiseId = branch.franchiseId;
      }
    }

    const lead = await this.prisma.lead.create({
      data: {
        customerId: dto.customerId,
        franchiseId: franchiseId!,
        branchId: branchId!,
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
      actorUserId,
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead.id,
      metadata: { customerId: lead.customerId, branchId: lead.branchId },
    }).catch(() => {});

    return lead;
  }

  async findAllLeads(branchId?: string, status?: LeadStatus, limit = 50, offset = 0) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
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

  async findOneLead(id: string) {
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

    return lead;
  }

  async assignLead(leadId: string, employeeId: string, actorUserId: string) {
    const lead = await this.findOneLead(leadId);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ID '${employeeId}' not found`);
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
      actorUserId,
      action: 'LEAD_ASSIGNED',
      entityType: 'Lead',
      entityId: leadId,
      metadata: { assignedEmployeeId: employeeId },
    }).catch(() => {});

    return updated;
  }

  async updateLeadStatus(leadId: string, status: LeadStatus, actorUserId: string) {
    await this.findOneLead(leadId);

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    await this.auditService.log({
      actorUserId,
      action: 'LEAD_STATUS_UPDATED',
      entityType: 'Lead',
      entityId: leadId,
      metadata: { newStatus: status },
    }).catch(() => {});

    return updated;
  }

  async addFollowUp(leadId: string, dto: CreateFollowUpDto, employeeId: string) {
    await this.findOneLead(leadId);

    return this.prisma.followUp.create({
      data: {
        leadId,
        employeeId,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
        status: 'PENDING',
      },
    });
  }

  async completeFollowUp(followUpId: string) {
    const followUp = await this.prisma.followUp.findUnique({
      where: { id: followUpId },
    });

    if (!followUp) {
      throw new NotFoundException(`FollowUp ID '${followUpId}' not found`);
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
