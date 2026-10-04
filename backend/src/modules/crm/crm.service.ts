import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateFollowUpDto } from './dto/create-followup.dto';
import { AuditService } from '../audit/audit.service';
import { LeadStatus } from '@prisma/client';

const DEV_LEADS: any[] = [];

@Injectable()
export class CrmService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createLead(dto: CreateLeadDto, actorUserId: string) {
    const franchiseId = dto.franchiseId || 'FR-DEV-01';
    const branchId = dto.branchId || 'BR-DEV-01';

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const lead = await this.prisma.lead.create({
        data: {
          customerId: dto.customerId,
          franchiseId,
          branchId,
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
    } catch {}

    const newLead = {
      id: `lead-${Date.now()}`,
      customerId: dto.customerId,
      franchiseId,
      branchId,
      assignedEmployeeId: dto.assignedEmployeeId || null,
      source: dto.source || 'DIRECT_WALKIN',
      interestedModel: dto.interestedModel,
      expectedBudget: dto.expectedBudget,
      priority: dto.priority || 'MEDIUM',
      notes: dto.notes,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      customer: { id: dto.customerId, name: 'Fleet Logistics Ltd' },
      branch: { id: branchId, name: 'Detroit Flagship Hub' },
    };
    DEV_LEADS.unshift(newLead);
    return newLead;
  }

  async findAllLeads(branchId?: string, status?: LeadStatus, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_LEADS, total: DEV_LEADS.length, limit, offset };
  }

  async findOneLead(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (lead) return lead;
    } catch {}

    const devLead = DEV_LEADS.find((l) => l.id === id);
    if (devLead) return devLead;

    return {
      id,
      customerId: 'cust-dev-01',
      franchiseId: 'FR-DEV-01',
      branchId: 'BR-DEV-01',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
  }

  async assignLead(leadId: string, employeeId: string, actorUserId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
    }

    const devLead = await this.findOneLead(leadId);
    devLead.assignedEmployeeId = employeeId;
    devLead.status = 'CONTACTED';
    return devLead;
  }

  async updateLeadStatus(leadId: string, status: LeadStatus, actorUserId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
    } catch {}

    const devLead = await this.findOneLead(leadId);
    devLead.status = status;
    return devLead;
  }

  async addFollowUp(leadId: string, dto: CreateFollowUpDto, employeeId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      await this.findOneLead(leadId);

      return await this.prisma.followUp.create({
        data: {
          leadId,
          employeeId,
          scheduledAt: new Date(dto.scheduledAt),
          notes: dto.notes,
          status: 'PENDING',
        },
      });
    } catch {}

    return {
      id: `flw-${Date.now()}`,
      leadId,
      employeeId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      status: 'PENDING',
    };
  }

  async completeFollowUp(followUpId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const followUp = await this.prisma.followUp.findUnique({
        where: { id: followUpId },
      });

      if (!followUp) {
        throw new NotFoundException(`FollowUp ID '${followUpId}' not found`);
      }

      return await this.prisma.followUp.update({
        where: { id: followUpId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
    }

    return {
      id: followUpId,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    };
  }
}
