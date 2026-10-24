import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AuditService } from '../audit/audit.service';
import { AnnouncementCategory, AnnouncementPriority, AnnouncementStatus } from '@prisma/client';
import { resolveUserScope } from '@/common/utils/scope.util';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Validate that the publisher has permission to target the chosen audience
   */
  private async validateAudienceScope(
    dto: CreateAnnouncementDto | UpdateAnnouncementDto,
    user: any,
  ) {
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    if (isSuperAdmin) return; // Super admin has full platform targeting rights

    const scope = await resolveUserScope(this.prisma, user);
    const target = dto.targetAudience || 'PLATFORM_WIDE';

    if (target === 'PLATFORM_WIDE') {
      throw new ForbiddenException('Only Super Admin can broadcast platform-wide announcements.');
    }

    if (scope.isActingFranchiseLevel) {
      // Franchise owner / franchise manager
      if (target === 'FRANCHISE') {
        if (dto.franchiseId && dto.franchiseId !== scope.effectiveFranchiseId) {
          throw new ForbiddenException('Cannot target an announcement to a franchise other than your own.');
        }
      } else if (target === 'BRANCH') {
        if (dto.branchId) {
          const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
          if (!branch || branch.franchiseId !== scope.effectiveFranchiseId) {
            throw new ForbiddenException('Selected branch does not belong to your authorised franchise.');
          }
        }
      } else if (target === 'SELECTED_BRANCHES' && dto.targetBranchIds?.length) {
        const branches = await this.prisma.branch.findMany({
          where: { id: { in: dto.targetBranchIds } },
        });
        const invalid = branches.some((b) => b.franchiseId !== scope.effectiveFranchiseId);
        if (invalid || branches.length !== dto.targetBranchIds.length) {
          throw new ForbiddenException('All targeted branches must belong to your authorised franchise.');
        }
      }
    } else {
      // Branch level manager
      const isBranchManager = roles.includes('BRANCH_MANAGER');
      if (!isBranchManager) {
        throw new ForbiddenException('Only Branch Managers, Franchise Executives, or Super Admins can publish announcements.');
      }

      if (target !== 'BRANCH') {
        throw new ForbiddenException('Branch Managers can only publish announcements targeted to their own branch.');
      }

      if (dto.branchId && dto.branchId !== scope.effectiveBranchId) {
        throw new ForbiddenException('Cannot publish an announcement targeting another branch.');
      }
    }
  }

  async createAnnouncement(dto: CreateAnnouncementDto, user: any) {
    await this.validateAudienceScope(dto, user);

    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const scope = await resolveUserScope(this.prisma, user);

    // Auto-fill franchise and branch scoping based on audience if not explicitly provided
    let franchiseId = dto.franchiseId;
    let branchId = dto.branchId;
    const target = dto.targetAudience || (roles.includes('SUPER_ADMIN') ? 'PLATFORM_WIDE' : 'BRANCH');

    if (target === 'BRANCH' && !branchId) {
      branchId = scope.effectiveBranchId || user.branchId;
    }
    if (target === 'FRANCHISE' && !franchiseId) {
      franchiseId = scope.effectiveFranchiseId || user.franchiseId;
    }

    const employee = user?.employeeProfile || (await this.prisma.employee.findFirst({ where: { userId: user.id } }));
    const authorName = employee ? `${employee.firstName} ${employee.lastName}` : (user.email.split('@')[0]);
    const authorRole = roles[0] || 'STAFF';

    const status = dto.status || 'PUBLISHED';
    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        category: dto.category || 'GENERAL',
        priority: dto.priority || 'NORMAL',
        status,
        targetAudience: target,
        franchiseId: franchiseId || null,
        branchId: branchId || null,
        targetBranchIds: dto.targetBranchIds || [],
        authorUserId: user.id,
        authorName,
        authorRole,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        publishedAt,
      },
      include: {
        franchise: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    // Automatically mark read for author
    await this.prisma.announcementRead.create({
      data: {
        announcementId: announcement.id,
        userId: user.id,
      },
    }).catch(() => {});

    // Create in-app notifications if published
    if (status === 'PUBLISHED') {
      await this.notifyAudience(announcement);
    }

    await this.auditService.log({
      actorUserId: user.id,
      action: 'ANNOUNCEMENT_CREATED',
      entityType: 'Announcement',
      entityId: announcement.id,
      metadata: { title: announcement.title, audience: announcement.targetAudience, status: announcement.status },
    }).catch(() => {});

    return announcement;
  }

  async findAllAnnouncements(
    user: any,
    filters?: {
      category?: AnnouncementCategory;
      priority?: AnnouncementPriority;
      readStatus?: 'ALL' | 'UNREAD' | 'READ';
      status?: AnnouncementStatus;
      search?: string;
    },
  ) {
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const scope = await resolveUserScope(this.prisma, user);

    const now = new Date();
    const where: any = {};

    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;

    // Search query
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { authorName: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (!isSuperAdmin) {
      // Standard users only see:
      // 1. Their own created announcements (even if draft)
      // 2. OR Published announcements where expiryDate is null or in future, and audience matches
      const audienceConditions: any[] = [
        { authorUserId: user.id },
        {
          status: 'PUBLISHED',
          startDate: { lte: now },
          OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
          AND: [
            {
              OR: [
                { targetAudience: 'PLATFORM_WIDE' },
                ...(scope.effectiveFranchiseId
                  ? [
                      { targetAudience: 'FRANCHISE', franchiseId: scope.effectiveFranchiseId },
                      {
                        targetAudience: 'BRANCH',
                        branch: { franchiseId: scope.effectiveFranchiseId },
                      },
                    ]
                  : []),
                ...(scope.effectiveBranchId
                  ? [
                      { targetAudience: 'BRANCH', branchId: scope.effectiveBranchId },
                      {
                        targetAudience: 'SELECTED_BRANCHES',
                        targetBranchIds: { has: scope.effectiveBranchId },
                      },
                    ]
                  : []),
              ],
            },
          ],
        },
      ];

      where.AND = [{ OR: audienceConditions }];
    } else {
      // Super admin can filter by status explicitly
      if (filters?.status) {
        where.status = filters.status;
      }
    }

    const announcements = await this.prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        franchise: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
        reads: {
          select: { userId: true, readAt: true },
        },
      },
    });

    // Enrich with read status for current user
    const items = announcements.map((a) => {
      const userRead = a.reads.find((r) => r.userId === user.id);
      return {
        ...a,
        isRead: Boolean(userRead),
        readAt: userRead?.readAt || null,
        readCount: a.reads.length,
        reads: undefined, // Do not leak full user read lists to clients
      };
    });

    if (filters?.readStatus === 'UNREAD') {
      return items.filter((a) => !a.isRead);
    } else if (filters?.readStatus === 'READ') {
      return items.filter((a) => a.isRead);
    }

    return items;
  }

  async findOneAnnouncement(id: string, user: any) {
    const a = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        franchise: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
        reads: {
          where: { userId: user.id },
          select: { readAt: true },
        },
      },
    });

    if (!a) {
      throw new NotFoundException(`Announcement '${id}' not found`);
    }

    // Check audience visibility
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');

    if (!isSuperAdmin && a.authorUserId !== user.id) {
      if (a.status !== 'PUBLISHED') {
        throw new ForbiddenException('This announcement is currently in draft status.');
      }
      const scope = await resolveUserScope(this.prisma, user);

      if (a.targetAudience === 'FRANCHISE' && a.franchiseId !== scope.effectiveFranchiseId) {
        throw new ForbiddenException('This announcement is not intended for your franchise.');
      }
      if (a.targetAudience === 'BRANCH' && a.branchId !== scope.effectiveBranchId) {
        throw new ForbiddenException('This announcement is not intended for your branch.');
      }
      if (
        a.targetAudience === 'SELECTED_BRANCHES' &&
        scope.effectiveBranchId &&
        !a.targetBranchIds.includes(scope.effectiveBranchId)
      ) {
        throw new ForbiddenException('This announcement is not intended for your branch.');
      }
    }

    // Automatically mark read on viewing detail
    await this.markAsRead(id, user.id).catch(() => {});

    return {
      ...a,
      isRead: true,
      readAt: a.reads[0]?.readAt || new Date(),
      reads: undefined,
    };
  }

  async markAsRead(announcementId: string, userId: string) {
    return this.prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        announcementId,
        userId,
        readAt: new Date(),
      },
    });
  }

  async updateAnnouncement(id: string, dto: UpdateAnnouncementDto, user: any) {
    const existing = await this.findOneAnnouncement(id, user);

    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');

    if (!isSuperAdmin && existing.authorUserId !== user.id) {
      throw new ForbiddenException('Only the author or Super Admin can modify this announcement.');
    }

    if (dto.targetAudience || dto.branchId || dto.franchiseId || dto.targetBranchIds) {
      await this.validateAudienceScope(dto, user);
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        content: dto.content !== undefined ? dto.content.trim() : undefined,
        category: dto.category || undefined,
        priority: dto.priority || undefined,
        targetAudience: dto.targetAudience || undefined,
        franchiseId: dto.franchiseId !== undefined ? dto.franchiseId : undefined,
        branchId: dto.branchId !== undefined ? dto.branchId : undefined,
        targetBranchIds: dto.targetBranchIds !== undefined ? dto.targetBranchIds : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        status: dto.status || undefined,
        publishedAt: dto.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : undefined,
      },
      include: {
        franchise: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    if (dto.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      await this.notifyAudience(updated);
    }

    await this.auditService.log({
      actorUserId: user.id,
      action: 'ANNOUNCEMENT_UPDATED',
      entityType: 'Announcement',
      entityId: id,
      metadata: { changes: dto },
    }).catch(() => {});

    return updated;
  }

  async publishAnnouncement(id: string, user: any) {
    return this.updateAnnouncement(id, { status: 'PUBLISHED' }, user);
  }

  async unpublishAnnouncement(id: string, user: any) {
    return this.updateAnnouncement(id, { status: 'DRAFT' }, user);
  }

  async archiveAnnouncement(id: string, user: any) {
    return this.updateAnnouncement(id, { status: 'ARCHIVED' }, user);
  }

  async getUnreadCount(user: any) {
    const announcements = await this.findAllAnnouncements(user, { readStatus: 'UNREAD' });
    return { unreadCount: announcements.length };
  }

  private async notifyAudience(announcement: any) {
    // Look up eligible user accounts to notify based on audience
    const userWhere: any = { status: 'ACTIVE' };

    if (announcement.targetAudience === 'BRANCH' && announcement.branchId) {
      userWhere.employeeProfile = { branchId: announcement.branchId };
    } else if (announcement.targetAudience === 'SELECTED_BRANCHES' && announcement.targetBranchIds?.length) {
      userWhere.employeeProfile = { branchId: { in: announcement.targetBranchIds } };
    } else if (announcement.targetAudience === 'FRANCHISE' && announcement.franchiseId) {
      userWhere.employeeProfile = { branch: { franchiseId: announcement.franchiseId } };
    }

    const recipients = await this.prisma.user.findMany({
      where: userWhere,
      take: 200,
      select: { id: true },
    });

    // Create in-app notifications
    const notifications = recipients.map((r) => ({
      userId: r.id,
      title: `Announcement: ${announcement.title}`,
      body: announcement.content.slice(0, 150) + (announcement.content.length > 150 ? '...' : ''),
      channel: 'IN_APP' as any,
      status: 'SENT' as any,
      sentAt: new Date(),
      metadata: { announcementId: announcement.id, category: announcement.category, priority: announcement.priority },
    }));

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({
        data: notifications,
        skipDuplicates: true,
      }).catch(() => {});
    }
  }
}
