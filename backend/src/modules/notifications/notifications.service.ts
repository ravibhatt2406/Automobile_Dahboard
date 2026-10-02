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
    const where: any = { userId };
    if (status) where.status = status;

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.notification.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status: 'READ' },
    });
  }
}
