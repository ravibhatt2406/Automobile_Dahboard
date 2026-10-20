import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignExpenseDto } from './dto/create-campaign-expense.dto';
import { AddCampaignMemberDto } from './dto/add-campaign-member.dto';
import { CampaignStatus, Prisma } from '@prisma/client';
import { resolveUserScope } from '@/common/utils/scope.util';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateCampaignDto, user: any) {
    const actorUserId = user?.id;
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

    let branchId = dto.branchId || user?.branchId;
    if (!branchId) {
      throw new BadRequestException('branchId is required to create a campaign/camp');
    }

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch '${branchId}' not found`);
    }

    let franchiseId = dto.franchiseId || branch.franchiseId;

    if (!isSuperAdmin) {
      if (user?.branchId && user.branchId !== branch.id) {
        throw new ForbiddenException('Cannot create campaign for another branch');
      }
      if (user?.franchiseId && user.franchiseId !== branch.franchiseId) {
        throw new ForbiddenException('Cannot create campaign for another franchise');
      }
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end date format');
    }
    if (end < start) {
      throw new BadRequestException('Campaign end date cannot be earlier than start date');
    }

    if (dto.coordinatorId) {
      const coordinator = await this.prisma.employee.findUnique({
        where: { id: dto.coordinatorId },
      });
      if (!coordinator) {
        throw new NotFoundException(`Coordinator employee ID '${dto.coordinatorId}' not found`);
      }
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        location: dto.location?.trim() || null,
        startDate: start,
        endDate: end,
        coordinatorId: dto.coordinatorId || null,
        franchiseId,
        branchId: branch.id,
        budget: dto.budget ? new Prisma.Decimal(dto.budget) : new Prisma.Decimal(0),
        status: dto.status || CampaignStatus.UPCOMING,
        notes: dto.notes?.trim() || null,
      },
      include: {
        branch: true,
        coordinator: true,
      },
    });

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'CAMPAIGN_CREATED',
      entityType: 'Campaign',
      entityId: campaign.id,
      metadata: { name: campaign.name, branchId: campaign.branchId, budget: dto.budget },
    }).catch(() => {});

    return campaign;
  }

  async findAll(
    branchId?: string,
    franchiseId?: string,
    status?: CampaignStatus,
    search?: string,
    startDate?: string,
    endDate?: string,
    limit = 50,
    offset = 0,
    user?: any,
  ) {
    const where: Prisma.CampaignWhereInput = {};
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

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { location: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (startDate && endDate) {
      where.startDate = { gte: new Date(startDate) };
      where.endDate = { lte: new Date(endDate) };
    } else if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    const [items, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { startDate: 'desc' },
        include: {
          branch: true,
          coordinator: true,
          teamMembers: {
            include: { employee: true },
          },
          expenses: true,
          _count: {
            select: {
              leads: true,
              expenses: true,
            },
          },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    // Compute genuine expense sum per campaign from actual recorded expenses
    const enrichedItems = items.map((camp) => {
      const actualExpenses = camp.expenses.reduce(
        (sum, exp) => sum + Number(exp.amount),
        0,
      );
      return {
        ...camp,
        actualExpenses,
        budgetVariance: Number(camp.budget) - actualExpenses,
        leadsCount: camp._count.leads,
      };
    });

    return { items: enrichedItems, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        branch: { include: { franchise: true } },
        coordinator: true,
        teamMembers: {
          include: { employee: true },
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
        },
        leads: {
          include: {
            customer: true,
            assignedEmployee: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID '${id}' not found`);
    }

    if (user) {
      const scope = user?.effectiveScope || (await resolveUserScope(this.prisma, user));
      if (!scope.isActingSuperAdmin) {
        if (scope.isActingFranchiseLevel) {
          if (scope.effectiveFranchiseId && campaign.franchiseId !== scope.effectiveFranchiseId) {
            throw new ForbiddenException('Access denied to campaign in another franchise');
          }
          if (scope.effectiveBranchId && campaign.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to campaign in another branch');
          }
        } else {
          if (scope.effectiveBranchId && campaign.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to campaign in another branch');
          }
        }
      }
    }

    // Genuine metrics calculation from actual related database records
    const actualExpenses = campaign.expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0,
    );

    const leadIds = campaign.leads.map((l) => l.id);
    const customerIds = campaign.leads.map((l) => l.customerId);

    let quotationsCount = 0;
    let bookingsCount = 0;

    if (leadIds.length > 0) {
      quotationsCount = await this.prisma.quotation.count({
        where: {
          OR: [
            { leadId: { in: leadIds } },
            { customerId: { in: customerIds } },
          ],
        },
      });

      bookingsCount = await this.prisma.booking.count({
        where: {
          OR: [
            { customerId: { in: customerIds } },
            { quotation: { leadId: { in: leadIds } } },
          ],
        },
      });
    }

    return {
      ...campaign,
      actualExpenses,
      budgetVariance: Number(campaign.budget) - actualExpenses,
      metrics: {
        leadsCount: campaign.leads.length,
        quotationsCount,
        bookingsCount,
        totalExpenses: actualExpenses,
        budget: Number(campaign.budget),
      },
    };
  }

  async update(id: string, dto: UpdateCampaignDto, user: any) {
    const existing = await this.findOne(id, user);

    let startDate = existing.startDate;
    let endDate = existing.endDate;

    if (dto.startDate) {
      startDate = new Date(dto.startDate);
      if (isNaN(startDate.getTime())) throw new BadRequestException('Invalid start date');
    }
    if (dto.endDate) {
      endDate = new Date(dto.endDate);
      if (isNaN(endDate.getTime())) throw new BadRequestException('Invalid end date');
    }
    if (endDate < startDate) {
      throw new BadRequestException('Campaign end date cannot be earlier than start date');
    }

    if (dto.coordinatorId) {
      const coordinator = await this.prisma.employee.findUnique({
        where: { id: dto.coordinatorId },
      });
      if (!coordinator) {
        throw new NotFoundException(`Coordinator employee ID '${dto.coordinatorId}' not found`);
      }
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description?.trim() : undefined,
        location: dto.location !== undefined ? dto.location?.trim() : undefined,
        startDate: dto.startDate ? startDate : undefined,
        endDate: dto.endDate ? endDate : undefined,
        coordinatorId: dto.coordinatorId !== undefined ? dto.coordinatorId : undefined,
        budget: dto.budget !== undefined ? new Prisma.Decimal(dto.budget) : undefined,
        status: dto.status || undefined,
        notes: dto.notes !== undefined ? dto.notes?.trim() : undefined,
      },
      include: {
        branch: true,
        coordinator: true,
        teamMembers: { include: { employee: true } },
      },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'CAMPAIGN_UPDATED',
      entityType: 'Campaign',
      entityId: id,
      metadata: { name: updated.name, status: updated.status },
    }).catch(() => {});

    return updated;
  }

  async recordExpense(campaignId: string, dto: CreateCampaignExpenseDto, user: any) {
    const campaign = await this.findOne(campaignId, user);

    const expenseDate = dto.expenseDate ? new Date(dto.expenseDate) : new Date();
    if (isNaN(expenseDate.getTime())) {
      throw new BadRequestException('Invalid expense date');
    }

    const expense = await this.prisma.campaignExpense.create({
      data: {
        campaignId: campaign.id,
        title: dto.title.trim(),
        category: dto.category?.trim() || 'LOGISTICS',
        amount: new Prisma.Decimal(dto.amount),
        expenseDate,
        recordedById: user?.id || null,
        receiptUrl: dto.receiptUrl || null,
        notes: dto.notes?.trim() || null,
      },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'CAMPAIGN_EXPENSE_RECORDED',
      entityType: 'CampaignExpense',
      entityId: expense.id,
      metadata: { campaignId, amount: dto.amount, title: dto.title },
    }).catch(() => {});

    return expense;
  }

  async addMember(campaignId: string, dto: AddCampaignMemberDto, user: any) {
    const campaign = await this.findOne(campaignId, user);

    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${dto.employeeId}' not found`);
    }

    if (employee.branchId !== campaign.branchId && user?.branchId === campaign.branchId) {
      throw new BadRequestException('Employee must belong to the responsible branch');
    }

    const member = await this.prisma.campaignMember.upsert({
      where: {
        campaignId_employeeId: {
          campaignId: campaign.id,
          employeeId: dto.employeeId,
        },
      },
      create: {
        campaignId: campaign.id,
        employeeId: dto.employeeId,
        roleInCamp: dto.roleInCamp?.trim() || 'Team Member',
      },
      update: {
        roleInCamp: dto.roleInCamp?.trim() || 'Team Member',
      },
      include: {
        employee: true,
      },
    });

    return member;
  }

  async removeMember(campaignId: string, employeeId: string, user: any) {
    await this.findOne(campaignId, user);

    await this.prisma.campaignMember.deleteMany({
      where: {
        campaignId,
        employeeId,
      },
    });

    return { success: true, message: 'Member removed from campaign' };
  }
}
