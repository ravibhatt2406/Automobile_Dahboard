import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

export interface LogAuditParams {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

const DEV_AUDIT_LOGS: any[] = [
  {
    id: 'log-01',
    actorUserId: 'usr-admin-01',
    action: 'LOGIN',
    entityType: 'User',
    entityId: 'usr-admin-01',
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogAuditParams) {
    // Sanitize metadata to prevent logging sensitive keys
    const sanitizedMetadata = params.metadata ? { ...params.metadata } : {};
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.passwordHash;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.secret;

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      return await this.prisma.auditLog.create({
        data: {
          actorUserId: params.actorUserId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId || null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : undefined,
        },
      });
    } catch {
      const devLog = {
        id: `log-${Date.now()}`,
        actorUserId: params.actorUserId || 'usr-admin-01',
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        metadata: sanitizedMetadata,
        createdAt: new Date().toISOString(),
      };
      DEV_AUDIT_LOGS.unshift(devLog);
      return devLog;
    }
  }

  async findAll(limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      return await this.prisma.auditLog.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: {
              id: true,
              email: true,
              accountType: true,
            },
          },
        },
      });
    } catch {
      return DEV_AUDIT_LOGS.slice(offset, offset + limit);
    }
  }
}
