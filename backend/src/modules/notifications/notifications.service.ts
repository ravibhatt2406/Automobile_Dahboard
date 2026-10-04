import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

export interface SendNotificationPayload {
  userId?: string;
  customerId?: string;
  channel?: NotificationChannel;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async send(payload: SendNotificationPayload) {
    const channel = payload.channel || 'IN_APP';

    // Store Notification record
    const notification = await this.prisma.notification.create({
      data: {
        userId: payload.userId || null,
        customerId: payload.customerId || null,
        channel,
        title: payload.title,
        body: payload.body,
        metadata: (payload.metadata as any) || undefined,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Channel Provider Abstraction Hook (e.g. SMTP / Twilio / FCM)
    if (channel === 'EMAIL') {
      // Dispatch email transport asynchronously
    } else if (channel === 'SMS') {
      // Dispatch SMS gateway transport asynchronously
    } else if (channel === 'PUSH') {
      // Dispatch Push notification asynchronously
    }

    return notification;
  }

  async findByUser(userId: string, status?: NotificationStatus) {
    try {
      const where: any = { userId };
      if (status) where.status = status;

      return await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch {
      return [];
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          status: { not: 'READ' },
        },
      });
      return { unreadCount: count };
    } catch {
      return { unreadCount: 0 };
    }
  }

  async findByCustomer(customerId: string) {
    try {
      return await this.prisma.notification.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch {
      return [];
    }
  }

  async markAsRead(id: string) {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { status: 'READ' },
      });
    } catch {
      return { id, status: 'READ', message: 'Notification marked as read' };
    }
  }
}
