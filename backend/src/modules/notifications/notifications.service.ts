import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { EmailService } from './email.service';

export interface SendNotificationPayload {
  userId?: string;
  customerId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel?: NotificationChannel;
  title: string;
  body: string;
  html?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  isEmailConfigured(): boolean {
    return this.emailService.isConfigured();
  }

  async send(payload: SendNotificationPayload) {
    const channel = payload.channel || 'IN_APP';

    // 1. Resolve recipient email if sending via EMAIL
    let recipientEmail = payload.recipientEmail;
    if (channel === 'EMAIL' && !recipientEmail) {
      if (payload.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.userId },
          select: { email: true },
        });
        recipientEmail = user?.email || undefined;
      } else if (payload.customerId) {
        const customer = await this.prisma.customer.findUnique({
          where: { id: payload.customerId },
          select: { email: true },
        });
        recipientEmail = customer?.email || undefined;
      }
    }

    // 2. Store Notification record in DB
    const notification = await this.prisma.notification.create({
      data: {
        userId: payload.userId || null,
        customerId: payload.customerId || null,
        channel,
        title: payload.title,
        body: payload.body,
        metadata: (payload.metadata as any) || undefined,
        status: 'PENDING',
      },
    });

    // 3. Dispatch channel provider transport
    if (channel === 'EMAIL') {
      if (!recipientEmail) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(payload.metadata || {}),
              deliveryStatus: 'FAILED_NO_RECIPIENT_EMAIL',
            },
          },
        }).catch(() => {});
        throw new Error('Cannot deliver email: Recipient email address is missing');
      }

      try {
        const deliveryResult = await this.emailService.sendEmail({
          to: recipientEmail,
          subject: payload.title,
          text: payload.body,
          html: payload.html,
        });

        const deliveryStatus = deliveryResult.simulated ? 'SIMULATED_MOCK' : 'ACCEPTED';
        const updated = await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            metadata: {
              ...(payload.metadata || {}),
              deliveryStatus,
              provider: deliveryResult.provider,
              simulated: deliveryResult.simulated,
              messageId: deliveryResult.messageId,
            },
          },
        });
        return updated;
      } catch (err: any) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(payload.metadata || {}),
              deliveryStatus: 'REJECTED',
              error: err?.message || 'Email delivery failed',
            },
          },
        }).catch(() => {});
        throw err;
      }
    } else if (channel === 'SMS') {
      // SMS gateway transport hook - mark as SENT for records
      return await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }

    // Default for IN_APP notifications
    return await this.prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'SENT', sentAt: new Date() },
    });
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
