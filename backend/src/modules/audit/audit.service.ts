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

  private sanitizeValue(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.sanitizeValue(item));

    const SENSITIVE_PATTERNS = [
      'password',
      'secret',
      'token',
      'jwt',
      'authorization',
      'apikey',
      'signature',
      'hash',
      'privatekey',
      'cvv',
      'pin',
    ];

    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_PATTERNS.some((pattern) => lowerKey.includes(pattern));
      if (!isSensitive) {
        sanitized[key] = this.sanitizeValue(val);
      }
    }
    return sanitized;
  }

  async log(params: LogAuditParams) {
    // Sanitize metadata to prevent logging sensitive keys recursively
    const sanitizedMetadata = params.metadata ? this.sanitizeValue(params.metadata) : {};

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
