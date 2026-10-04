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

    return this.prisma.auditLog.create({
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
  }

  async findAll(entityType?: string, limit = 50, offset = 0) {
    const where: any = {};
    if (entityType) where.entityType = entityType;

    return this.prisma.auditLog.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        actorUser: {
          select: { id: true, email: true, accountType: true },
        },
      },
    });
  }
}
