import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateFollowUpDto } from './dto/create-followup.dto';
import { AuditService } from '../audit/audit.service';
import { LeadStatus } from '@prisma/client';
import { resolveUserScope } from '@/common/utils/scope.util';

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
    } else if (!customerId) {
      // Connect leads to existing customer records without creating unnecessary duplicates
      const prospectName = dto.prospectName?.trim();
      const rawPhone = dto.prospectPhone?.trim();
      if (!prospectName || !rawPhone) {
        throw new BadRequestException('Either an existing customerId or prospectName and prospectPhone are required');
      }
      const cleanPhone = rawPhone.replace(/\s+/g, '');

      let existingCustomer = await this.prisma.customer.findFirst({
        where: { phone: cleanPhone },
      });

      if (!existingCustomer) {
        existingCustomer = await this.prisma.customer.create({
          data: {
            name: prospectName,
            phone: cleanPhone,
            email: dto.prospectEmail?.trim().toLowerCase() || null,
            companyName: dto.companyName?.trim() || null,
            customerType: dto.companyName?.trim() ? 'BUSINESS' : 'INDIVIDUAL',
            preferredBranchId: branch.id,
            status: 'ACTIVE',
            franchiseLinks: {
              create: { franchiseId: branch.franchiseId },
            },
          },
        });
      }
      customerId = existingCustomer.id;
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
        campaignId: dto.campaignId || null,
        interestedModel: dto.interestedModel,
        expectedBudget: dto.expectedBudget,
        priority: dto.priority || 'MEDIUM',
        notes: dto.notes,
        lostReason: dto.lostReason,
        status: 'NEW',
      },
      include: {
        customer: true,
        branch: true,
        assignedEmployee: true,
        campaign: true,
      },
    });

    if (dto.nextFollowUpDate) {
      const followUpEmployeeId = lead.assignedEmployeeId || (user?.employeeProfile?.id || user?.id);
      await this.prisma.followUp.create({
        data: {
          leadId: lead.id,
          employeeId: followUpEmployeeId,
          scheduledAt: new Date(dto.nextFollowUpDate),
          notes: `Follow-up scheduled: ${dto.notes || 'Prospect consultation'}`,
          status: 'PENDING',
        },
      }).catch(() => {});
    }

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead.id,
      metadata: { customerId: lead.customerId, branchId: lead.branchId },
    }).catch(() => {});

    return lead;
  }

  async findAllLeads(
    branchId?: string,
    status?: LeadStatus,
    limit = 50,
    offset = 0,
    user?: any,
    franchiseId?: string,
    startDate?: string,
    endDate?: string,
    campaignId?: string,
  ) {
    const where: any = {};
    const scope = user?.effectiveScope || (user ? await resolveUserScope(this.prisma, user, branchId, franchiseId) : null);

    if (scope && !scope.isActingSuperAdmin) {
      if (scope.isActingFranchiseLevel) {
        where.franchiseId = scope.effectiveFranchiseId;
        if (scope.effectiveBranchId) {
          where.branchId = scope.effectiveBranchId;
        }
      } else {
        where.branchId = scope.effectiveBranchId;
      }
    } else if (scope?.isActingSuperAdmin) {
      if (scope.effectiveFranchiseId) {
        where.franchiseId = scope.effectiveFranchiseId;
        if (scope.effectiveBranchId) {
          where.branchId = scope.effectiveBranchId;
        }
      } else if (scope.effectiveBranchId) {
        where.branchId = scope.effectiveBranchId;
      }
    }

    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

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
          campaign: true,
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
        campaign: true,
        followUps: { orderBy: { scheduledAt: 'desc' } },
        quotations: true,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead/Enquiry with ID ${id} not found`);
    }

    if (user) {
      const scope = user?.effectiveScope || (await resolveUserScope(this.prisma, user));
      if (!scope.isActingSuperAdmin) {
        if (scope.isActingFranchiseLevel) {
          if (scope.effectiveFranchiseId && lead.franchiseId !== scope.effectiveFranchiseId) {
            throw new ForbiddenException('Access denied to lead in another franchise');
          }
          if (scope.effectiveBranchId && lead.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to lead in another branch');
          }
        } else {
          if (scope.effectiveBranchId && lead.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to lead in another branch');
          }
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

  async updateLeadStatus(leadId: string, status: LeadStatus, user: any, lostReason?: string) {
    const lead = await this.findOneLead(leadId, user);

    // Business rule: Do not count a lead as a sale/won until a genuine qualifying business transaction exists
    if (status === 'CONVERTED') {
      const quotationsCount = await this.prisma.quotation.count({
        where: { leadId },
      });
      const bookingsCount = await this.prisma.booking.count({
        where: { customerId: lead.customerId },
      });

      if (quotationsCount === 0 && bookingsCount === 0) {
        throw new BadRequestException(
          'Cannot mark lead as CONVERTED (Won) without an active quotation or booking in the system.',
        );
      }
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        ...(status === 'LOST' && lostReason ? { lostReason } : {}),
      },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'LEAD_STATUS_UPDATED',
      entityType: 'Lead',
      entityId: leadId,
      metadata: { newStatus: status, lostReason },
    }).catch(() => {});

    return updated;
  }

  async updateLead(leadId: string, dto: UpdateLeadDto, user: any) {
    const lead = await this.findOneLead(leadId, user);

    // If status is transitioning to CONVERTED, enforce qualifying business transaction
    if (dto.status === 'CONVERTED' && lead.status !== 'CONVERTED') {
      const quotationsCount = await this.prisma.quotation.count({
        where: { leadId },
      });
      const bookingsCount = await this.prisma.booking.count({
        where: { customerId: lead.customerId },
      });

      if (quotationsCount === 0 && bookingsCount === 0) {
        throw new BadRequestException(
          'Cannot mark lead as CONVERTED (Won) without an active quotation or booking in the system.',
        );
      }
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        assignedEmployeeId: dto.assignedEmployeeId !== undefined ? dto.assignedEmployeeId : undefined,
        status: dto.status || undefined,
        priority: dto.priority || undefined,
        source: dto.source || undefined,
        campaignId: dto.campaignId !== undefined ? dto.campaignId : undefined,
        interestedModel: dto.interestedModel !== undefined ? dto.interestedModel : undefined,
        expectedBudget: dto.expectedBudget !== undefined ? dto.expectedBudget : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        lostReason: dto.lostReason !== undefined ? dto.lostReason : undefined,
      },
      include: {
        customer: true,
        branch: true,
        assignedEmployee: true,
        campaign: true,
        followUps: { orderBy: { scheduledAt: 'desc' } },
        quotations: true,
      },
    });

    if (dto.nextFollowUpDate) {
      await this.prisma.followUp.create({
        data: {
          leadId,
          employeeId: updated.assignedEmployeeId || (user?.employeeProfile?.id || user?.id),
          scheduledAt: new Date(dto.nextFollowUpDate),
          notes: `Follow-up updated: ${dto.notes || 'Prospect discussion'}`,
          status: 'PENDING',
        },
      }).catch(() => {});
    }

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'LEAD_UPDATED',
      entityType: 'Lead',
      entityId: leadId,
      metadata: { changes: dto },
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
