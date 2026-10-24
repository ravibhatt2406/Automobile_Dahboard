import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateFollowUpDto } from './dto/create-followup.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
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

    const franchiseId = dto.franchiseId || branch.franchiseId;

    let customerId = dto.customerId;
    const prospectName = dto.prospectName?.trim() || null;
    const rawPhone = dto.prospectPhone?.trim() || null;
    const prospectEmail = dto.prospectEmail?.trim().toLowerCase() || null;
    const companyName = dto.companyName?.trim() || null;

    if (isCustomer) {
      customerId = user?.customerProfile?.id || user?.customerId;
      if (!customerId) {
        const cust = await this.prisma.customer.findFirst({ where: { userId: actorUserId } });
        if (!cust) throw new ForbiddenException('No customer profile associated with user account');
        customerId = cust.id;
      }
    } else if (!customerId) {
      if (!prospectName && !rawPhone) {
        throw new BadRequestException('Either an existing customerId or prospectName and prospectPhone are required');
      }
      if (rawPhone) {
        const cleanPhone = rawPhone.replace(/\s+/g, '');
        const existingCustomer = await this.prisma.customer.findFirst({
          where: { phone: cleanPhone },
        });
        if (existingCustomer) {
          customerId = existingCustomer.id;
        }
      }
    }

    const scope = user?.effectiveScope;
    const allowedBranchId = scope?.effectiveBranchId || user.assignedBranchId || user.branchId;
    const allowedFranchiseId = scope?.effectiveFranchiseId || user.assignedFranchiseId || user.franchiseId;

    if (!isSuperAdmin && !isCustomer) {
      if (allowedBranchId && allowedBranchId !== branch.id) {
        throw new ForbiddenException('Cannot create lead for another branch');
      }
      if (allowedFranchiseId && allowedFranchiseId !== branch.franchiseId) {
        throw new ForbiddenException('Cannot create lead for another franchise');
      }
    }

    // Generate readable lead number
    const year = new Date().getFullYear();
    const count = await this.prisma.lead.count();
    const leadNumber = `LD-${year}-${String(count + 1).padStart(5, '0')}`;

    const lead = await this.prisma.lead.create({
      data: {
        leadNumber,
        customerId: customerId || null,
        prospectName,
        prospectPhone: rawPhone,
        prospectEmail,
        companyName,
        franchiseId,
        branchId: branch.id,
        assignedEmployeeId: dto.assignedEmployeeId || null,
        source: dto.source || 'DIRECT_WALKIN',
        campaignId: dto.campaignId || null,
        interestedModel: dto.interestedModel,
        expectedPurchaseDate: dto.expectedPurchaseDate ? new Date(dto.expectedPurchaseDate) : null,
        expectedBudget: dto.expectedBudget,
        priority: dto.priority || 'MEDIUM',
        notes: dto.notes,
        lostReason: dto.lostReason,
        status: 'NEW',
        activities: {
          create: {
            activityType: 'NOTE',
            title: 'Lead Opportunity Created',
            description: `Channel Source: ${dto.source || 'DIRECT_WALKIN'}. Initial Notes: ${dto.notes || 'None'}`,
            employeeId: user?.employeeProfile?.id || null,
          },
        },
      },
      include: {
        customer: true,
        branch: true,
        assignedEmployee: true,
        campaign: true,
        activities: true,
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

      await this.prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          employeeId: followUpEmployeeId,
          activityType: 'FOLLOW_UP',
          title: `Initial Follow-Up Scheduled for ${new Date(dto.nextFollowUpDate).toLocaleDateString()}`,
          description: dto.notes || 'Prospect consultation scheduled',
          scheduledAt: new Date(dto.nextFollowUpDate),
        },
      }).catch(() => {});
    }

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead.id,
      metadata: { leadNumber: lead.leadNumber, customerId: lead.customerId, branchId: lead.branchId },
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
    view?: string,
    search?: string,
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

    // Role and View specific filters
    if (view === 'MY_LEADS') {
      const empId = user?.employeeProfile?.id || user?.employee?.id;
      if (empId) {
        where.assignedEmployeeId = empId;
      }
    } else if (view === 'FOLLOW_UPS_DUE') {
      where.followUps = {
        some: { status: 'PENDING' },
      };
    } else if (view === 'QUALIFIED') {
      where.status = { in: ['QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] };
    } else if (view === 'WON') {
      where.status = 'CONVERTED';
    } else if (view === 'LOST') {
      where.status = 'LOST';
    }

    // Keyword Search
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { leadNumber: { contains: q, mode: 'insensitive' } },
        { prospectName: { contains: q, mode: 'insensitive' } },
        { prospectPhone: { contains: q, mode: 'insensitive' } },
        { prospectEmail: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { interestedModel: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q, mode: 'insensitive' } } },
        { customer: { companyName: { contains: q, mode: 'insensitive' } } },
      ];
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
          activities: { orderBy: { createdAt: 'desc' }, take: 2 },
          quotations: {
            select: { id: true, quotationNumber: true, status: true, totalAmount: true },
          },
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
        followUps: {
          orderBy: { scheduledAt: 'desc' },
          include: { employee: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { employee: true },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
          include: {
            bookings: true,
          },
        },
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

    // Record activity
    await this.prisma.leadActivity.create({
      data: {
        leadId,
        employeeId: user?.employeeProfile?.id || null,
        activityType: 'NOTE',
        title: `Lead Reassigned to ${employee.firstName} ${employee.lastName}`,
        description: `Designation: ${employee.designation || 'Sales Executive'}. Code: ${employee.employeeCode}`,
      },
    }).catch(() => {});

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

    if (status === 'LOST') {
      if (!lostReason || !lostReason.trim()) {
        throw new BadRequestException('A reason is mandatory when marking a lead as Lost.');
      }
    }

    // Business rule: Do not count a lead as a sale/won until a genuine qualifying business transaction exists
    if (status === 'CONVERTED') {
      const quotationsCount = await this.prisma.quotation.count({
        where: { leadId },
      });
      const bookingsCount = lead.customerId
        ? await this.prisma.booking.count({
            where: { customerId: lead.customerId },
          })
        : 0;

      if (quotationsCount === 0 && bookingsCount === 0) {
        throw new BadRequestException(
          'Cannot mark lead as CONVERTED (Won) without an active quotation or booking in the system.',
        );
      }
    }

    const previousStatus = lead.status;
    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        ...(status === 'LOST' && lostReason ? { lostReason: lostReason.trim() } : {}),
      },
    });

    // Record stage history
    await this.prisma.leadActivity.create({
      data: {
        leadId,
        employeeId: user?.employeeProfile?.id || null,
        activityType: 'STAGE_CHANGE',
        title: `Stage Changed: ${previousStatus} → ${status}`,
        description: status === 'LOST' ? `Lost Reason: ${lostReason}` : `Updated by ${user?.email || 'Authorized User'}`,
        metadata: { from: previousStatus, to: status, lostReason },
      },
    }).catch(() => {});

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
      const bookingsCount = lead.customerId
        ? await this.prisma.booking.count({
            where: { customerId: lead.customerId },
          })
        : 0;

      if (quotationsCount === 0 && bookingsCount === 0) {
        throw new BadRequestException(
          'Cannot mark lead as CONVERTED (Won) without an active quotation or booking in the system.',
        );
      }
    }

    if (dto.status === 'LOST' && (!dto.lostReason || !dto.lostReason.trim())) {
      throw new BadRequestException('A reason is mandatory when marking a lead as Lost.');
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
        expectedPurchaseDate: dto.expectedPurchaseDate !== undefined ? (dto.expectedPurchaseDate ? new Date(dto.expectedPurchaseDate) : null) : undefined,
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
        activities: { orderBy: { createdAt: 'desc' } },
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

  async addActivity(leadId: string, dto: CreateLeadActivityDto, user: any) {
    const lead = await this.findOneLead(leadId, user);
    const employeeId = user?.employeeProfile?.id || null;

    const activity = await this.prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        employeeId,
        activityType: dto.activityType,
        title: dto.title,
        description: dto.description || null,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      },
      include: { employee: true },
    });

    if (dto.activityType === 'FOLLOW_UP' && dto.scheduledAt) {
      await this.prisma.followUp.create({
        data: {
          leadId: lead.id,
          employeeId: employeeId || lead.assignedEmployeeId,
          scheduledAt: new Date(dto.scheduledAt),
          notes: dto.title + (dto.description ? `: ${dto.description}` : ''),
          status: dto.completedAt ? 'COMPLETED' : 'PENDING',
        },
      }).catch(() => {});
    }

    return activity;
  }

  async getActivities(leadId: string, user: any) {
    await this.findOneLead(leadId, user);
    return this.prisma.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { employee: true },
    });
  }

  async convertProspectToCustomer(leadId: string, user: any) {
    const lead = await this.findOneLead(leadId, user);

    if (lead.customerId) {
      return { customerId: lead.customerId, message: 'Lead already linked to a customer record' };
    }

    const name = lead.prospectName || 'Prospect Customer';
    const phone = lead.prospectPhone || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const customer = await this.prisma.customer.create({
      data: {
        name,
        phone,
        email: lead.prospectEmail || null,
        companyName: lead.companyName || null,
        customerType: lead.companyName ? 'BUSINESS' : 'INDIVIDUAL',
        preferredBranchId: lead.branchId,
        status: 'ACTIVE',
        franchiseLinks: {
          create: { franchiseId: lead.franchiseId },
        },
      },
    });

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { customerId: customer.id },
    });

    await this.prisma.leadActivity.create({
      data: {
        leadId,
        employeeId: user?.employeeProfile?.id || null,
        activityType: 'NOTE',
        title: `Prospect converted to active customer record: ${customer.name}`,
        description: `Created Customer ID: ${customer.id}`,
      },
    }).catch(() => {});

    return customer;
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

    const followUp = await this.prisma.followUp.create({
      data: {
        leadId,
        employeeId: employeeId || lead.assignedEmployeeId,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
        status: 'PENDING',
      },
    });

    await this.prisma.leadActivity.create({
      data: {
        leadId,
        employeeId: employeeId || null,
        activityType: 'FOLLOW_UP',
        title: `Follow-Up Scheduled: ${new Date(dto.scheduledAt).toLocaleDateString()}`,
        description: dto.notes,
        scheduledAt: new Date(dto.scheduledAt),
      },
    }).catch(() => {});

    return followUp;
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

    const updated = await this.prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    if (followUp.leadId) {
      await this.prisma.leadActivity.create({
        data: {
          leadId: followUp.leadId,
          employeeId: user?.employeeProfile?.id || null,
          activityType: 'FOLLOW_UP',
          title: `Follow-Up Completed: ${followUp.notes}`,
          description: `Completed at ${new Date().toLocaleString()}`,
          completedAt: new Date(),
        },
      }).catch(() => {});
    }

    return updated;
  }
}
