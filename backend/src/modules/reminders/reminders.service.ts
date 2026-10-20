import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import {
  ReminderCategory,
  ReminderStatus,
  Prisma,
} from '@prisma/client';
import { resolveUserScope } from '@/common/utils/scope.util';

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private cleanPhoneNumber(rawPhone: string): string {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.length === 10) {
      digits = '91' + digits; // Standard Indian country code default
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = '91' + digits.substring(1);
    }
    return digits;
  }

  private buildWhatsAppUrl(phone: string, text: string): string {
    const cleanPhone = this.cleanPhoneNumber(phone);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  async getEligibleReminders(
    branchId?: string,
    franchiseId?: string,
    category?: ReminderCategory,
    user?: any,
  ) {
    const scope = user?.effectiveScope || (user ? await resolveUserScope(this.prisma, user, branchId, franchiseId) : null);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const eligibleItems: any[] = [];

    // 1. SERVICE DUE
    if (!category || category === ReminderCategory.SERVICE_DUE) {
      const apptWhere: any = {
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        preferredDate: { lte: thirtyDaysFromNow, gte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      };
      if (scope && !scope.isActingSuperAdmin) {
        if (scope.isActingFranchiseLevel) {
          apptWhere.branch = { franchiseId: scope.effectiveFranchiseId };
          if (scope.effectiveBranchId) apptWhere.branchId = scope.effectiveBranchId;
        } else {
          apptWhere.branchId = scope.effectiveBranchId;
        }
      }

      const appointments = await this.prisma.serviceAppointment.findMany({
        where: apptWhere,
        take: 20,
        orderBy: { preferredDate: 'asc' },
        include: {
          customer: true,
          vehicle: { include: { variant: true } },
          branch: true,
        },
      });

      for (const a of appointments) {
        const dueDateStr = new Date(a.preferredDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const vehicleIdentifier = a.vehicle.registrationNumber || `${a.vehicle.vin} (${a.vehicle.variant?.name || 'Commercial Vehicle'})`;
        const draftMessage = `Dear ${a.customer.name}, your Titan Auto vehicle ${vehicleIdentifier} has a service booking scheduled on ${dueDateStr} at ${a.branch.name}. Please connect with our workshop desk to confirm your bay slot.`;

        eligibleItems.push({
          category: ReminderCategory.SERVICE_DUE,
          customerId: a.customerId,
          vehicleId: a.vehicleId,
          branchId: a.branchId,
          recipientName: a.customer.name,
          recipientPhone: a.customer.phone,
          referenceType: 'SERVICE_APPOINTMENT',
          referenceId: a.id,
          dueDate: a.preferredDate,
          draftMessage,
          branchName: a.branch.name,
          vehicleInfo: vehicleIdentifier,
        });
      }
    }

    // 2. INSURANCE EXPIRY
    if (!category || category === ReminderCategory.INSURANCE_EXPIRY) {
      const insWhere: any = {
        expiryDate: { lte: thirtyDaysFromNow },
        status: { in: ['ACTIVE', 'PENDING'] },
      };
      if (scope && !scope.isActingSuperAdmin) {
        if (scope.isActingFranchiseLevel) {
          insWhere.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
          if (scope.effectiveBranchId) insWhere.booking = { branchId: scope.effectiveBranchId };
        } else {
          insWhere.booking = { branchId: scope.effectiveBranchId };
        }
      }

      const policies = await this.prisma.insurancePolicy.findMany({
        where: insWhere,
        take: 20,
        orderBy: { expiryDate: 'asc' },
        include: {
          customer: true,
          booking: {
            include: {
              branch: true,
              vehicle: true,
            },
          },
        },
      });

      for (const p of policies) {
        const dueDateStr = new Date(p.expiryDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const reg = p.booking?.vehicle?.registrationNumber || p.booking?.vehicle?.vin || 'Fleet Vehicle';
        const draftMessage = `Dear ${p.customer.name}, the commercial vehicle insurance policy #${p.policyNumber} with ${p.insurer} for ${reg} is due for expiry on ${dueDateStr}. Please renew through Titan Auto to maintain continuous coverage.`;

        eligibleItems.push({
          category: ReminderCategory.INSURANCE_EXPIRY,
          customerId: p.customerId,
          vehicleId: p.booking?.vehicleId || null,
          branchId: p.booking?.branchId || null,
          recipientName: p.customer.name,
          recipientPhone: p.customer.phone,
          referenceType: 'INSURANCE_POLICY',
          referenceId: p.id,
          dueDate: p.expiryDate,
          draftMessage,
          branchName: p.booking?.branch?.name || 'Titan Auto',
          vehicleInfo: `${reg} (${p.insurer})`,
        });
      }
    }

    // 3. COMPLIANCE EXPIRY (PUC, Fitness, Permit)
    if (!category || category === ReminderCategory.COMPLIANCE_EXPIRY) {
      const compWhere: any = {
        expiryDate: { lte: thirtyDaysFromNow },
      };
      if (scope && !scope.isActingSuperAdmin) {
        if (scope.isActingFranchiseLevel) {
          compWhere.vehicle = { branch: { franchiseId: scope.effectiveFranchiseId } };
          if (scope.effectiveBranchId) compWhere.vehicle = { branchId: scope.effectiveBranchId };
        } else {
          compWhere.vehicle = { branchId: scope.effectiveBranchId };
        }
      }

      const complianceDocs = await this.prisma.vehicleComplianceDocument.findMany({
        where: compWhere,
        take: 20,
        orderBy: { expiryDate: 'asc' },
        include: {
          vehicle: {
            include: {
              customer: true,
              branch: true,
            },
          },
        },
      });

      for (const doc of complianceDocs) {
        if (!doc.vehicle?.customer) continue;
        const dueDateStr = doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) : 'Upcoming';
        const reg = doc.vehicle.registrationNumber || doc.vehicle.vin;
        const draftMessage = `Dear ${doc.vehicle.customer.name}, the ${doc.documentType} compliance certificate (#${doc.documentNumber}) for vehicle ${reg} expires on ${dueDateStr}. Please complete timely testing or renewal.`;

        eligibleItems.push({
          category: ReminderCategory.COMPLIANCE_EXPIRY,
          customerId: doc.vehicle.customerId,
          vehicleId: doc.vehicleId,
          branchId: doc.vehicle.branchId,
          recipientName: doc.vehicle.customer.name,
          recipientPhone: doc.vehicle.customer.phone,
          referenceType: 'COMPLIANCE_DOCUMENT',
          referenceId: doc.id,
          dueDate: doc.expiryDate,
          draftMessage,
          branchName: doc.vehicle.branch?.name || 'Titan Auto',
          vehicleInfo: `${reg} (${doc.documentType})`,
        });
      }
    }

    // 4. EMI DUE
    if (!category || category === ReminderCategory.EMI_DUE) {
      const emiWhere: any = {
        dueDate: { lte: sevenDaysFromNow },
        status: { in: ['UPCOMING', 'DUE', 'OVERDUE', 'PARTIALLY_PAID'] },
      };
      if (scope && !scope.isActingSuperAdmin) {
        if (scope.isActingFranchiseLevel) {
          emiWhere.financeApplication = {
            booking: { branch: { franchiseId: scope.effectiveFranchiseId } },
          };
          if (scope.effectiveBranchId) {
            emiWhere.financeApplication.booking.branchId = scope.effectiveBranchId;
          }
        } else {
          emiWhere.financeApplication = {
            booking: { branchId: scope.effectiveBranchId },
          };
        }
      }

      const emiSchedules = await this.prisma.financeEmiSchedule.findMany({
        where: emiWhere,
        take: 20,
        orderBy: { dueDate: 'asc' },
        include: {
          financeApplication: {
            include: {
              customer: true,
              booking: {
                include: {
                  branch: true,
                  vehicle: true,
                },
              },
            },
          },
        },
      });

      for (const e of emiSchedules) {
        const customer = e.financeApplication.customer;
        const booking = e.financeApplication.booking;
        const dueDateStr = new Date(e.dueDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const dueAmount = Number(e.emiAmount) - Number(e.paidAmount);
        const draftMessage = `Dear ${customer.name}, installment #${e.installmentNumber} of Rs. ${dueAmount.toLocaleString('en-IN')} for your commercial loan with ${e.financeApplication.financeProvider} is due on ${dueDateStr}. Please ensure adequate bank balance for timely auto-debit.`;

        eligibleItems.push({
          category: ReminderCategory.EMI_DUE,
          customerId: customer.id,
          vehicleId: booking?.vehicleId || null,
          branchId: booking?.branchId || null,
          recipientName: customer.name,
          recipientPhone: customer.phone,
          referenceType: 'FINANCE_EMI_SCHEDULE',
          referenceId: e.id,
          dueDate: e.dueDate,
          draftMessage,
          branchName: booking?.branch?.name || 'Titan Auto',
          vehicleInfo: `Loan Ref: ${e.financeApplication.loanReference || e.financeApplication.applicationNumber}`,
        });
      }
    }

    // Check recent duplicate reminders in last 3 days
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentReminders = await this.prisma.customerReminder.findMany({
      where: {
        createdAt: { gte: threeDaysAgo },
        status: { in: [ReminderStatus.PREPARED, ReminderStatus.USER_INITIATED] },
      },
      select: {
        customerId: true,
        referenceId: true,
        category: true,
        status: true,
        initiatedAt: true,
      },
    });

    const recentMap = new Set(recentReminders.map((r) => `${r.category}:${r.referenceId || r.customerId}`));

    const enrichedEligible = eligibleItems.map((item) => {
      const key = `${item.category}:${item.referenceId || item.customerId}`;
      const isRecent = recentMap.has(key);
      const cleanPhone = this.cleanPhoneNumber(item.recipientPhone);
      const isPhoneValid = cleanPhone.length >= 10;
      const whatsappUrl = isPhoneValid ? this.buildWhatsAppUrl(cleanPhone, item.draftMessage) : null;

      return {
        ...item,
        isPhoneValid,
        whatsappUrl,
        alreadyInitiatedRecently: isRecent,
      };
    });

    return enrichedEligible;
  }

  async create(dto: CreateReminderDto, user: any) {
    const actorUserId = user?.id;

    // Validate phone number
    const cleanPhone = this.cleanPhoneNumber(dto.recipientPhone);
    if (cleanPhone.length < 10) {
      throw new BadRequestException('Recipient phone number must contain at least 10 valid digits');
    }

    let branchId = dto.branchId || user?.branchId;
    if (!branchId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      branchId = customer?.preferredBranchId;
    }
    if (!branchId) {
      const firstBranch = await this.prisma.branch.findFirst();
      branchId = firstBranch?.id;
    }

    // Deduplication check: check if initiated in last 3 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recent = await this.prisma.customerReminder.findFirst({
      where: {
        customerId: dto.customerId,
        category: dto.category,
        referenceId: dto.referenceId || undefined,
        createdAt: { gte: threeDaysAgo },
        status: ReminderStatus.USER_INITIATED,
      },
    });

    if (recent) {
      throw new BadRequestException(
        'A reminder for this customer and record was already initiated within the last 3 days.',
      );
    }

    const reminder = await this.prisma.customerReminder.create({
      data: {
        customerId: dto.customerId,
        vehicleId: dto.vehicleId || null,
        branchId: branchId!,
        category: dto.category,
        recipientName: dto.recipientName.trim(),
        recipientPhone: cleanPhone,
        referenceType: dto.referenceType || 'NONE',
        referenceId: dto.referenceId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        messageTemplate: dto.messageTemplate || null,
        draftMessage: dto.draftMessage.trim(),
        status: ReminderStatus.PREPARED,
        preparedByUserId: actorUserId || null,
        notes: dto.notes?.trim() || null,
      },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
      },
    });

    const whatsappUrl = this.buildWhatsAppUrl(cleanPhone, reminder.draftMessage);

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'CUSTOMER_REMINDER_PREPARED',
      entityType: 'CustomerReminder',
      entityId: reminder.id,
      metadata: {
        category: reminder.category,
        recipient: reminder.recipientName,
        phone: reminder.recipientPhone,
      },
    }).catch(() => {});

    return {
      ...reminder,
      whatsappUrl,
    };
  }

  async markInitiated(id: string, user: any) {
    const reminder = await this.prisma.customerReminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder ID '${id}' not found`);
    }

    const updated = await this.prisma.customerReminder.update({
      where: { id },
      data: {
        status: ReminderStatus.USER_INITIATED,
        initiatedAt: new Date(),
      },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
      },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'CUSTOMER_REMINDER_WHATSAPP_OPENED',
      entityType: 'CustomerReminder',
      entityId: id,
      metadata: {
        category: reminder.category,
        recipientPhone: reminder.recipientPhone,
        status: ReminderStatus.USER_INITIATED,
      },
    }).catch(() => {});

    return updated;
  }

  async findAll(
    branchId?: string,
    franchiseId?: string,
    category?: ReminderCategory,
    status?: ReminderStatus,
    limit = 50,
    offset = 0,
    user?: any,
  ) {
    const where: Prisma.CustomerReminderWhereInput = {};
    const scope = user?.effectiveScope || (user ? await resolveUserScope(this.prisma, user, branchId, franchiseId) : null);

    if (scope && !scope.isActingSuperAdmin) {
      if (scope.isActingFranchiseLevel) {
        where.branch = { franchiseId: scope.effectiveFranchiseId };
        if (scope.effectiveBranchId) {
          where.branchId = scope.effectiveBranchId;
        }
      } else {
        where.branchId = scope.effectiveBranchId;
      }
    } else if (scope?.isActingSuperAdmin) {
      if (scope.effectiveFranchiseId) {
        where.branch = { franchiseId: scope.effectiveFranchiseId };
        if (scope.effectiveBranchId) {
          where.branchId = scope.effectiveBranchId;
        }
      } else if (scope.effectiveBranchId) {
        where.branchId = scope.effectiveBranchId;
      }
    }

    if (category) where.category = category;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.customerReminder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          vehicle: true,
          branch: true,
        },
      }),
      this.prisma.customerReminder.count({ where }),
    ]);

    const enriched = items.map((r) => ({
      ...r,
      whatsappUrl: this.buildWhatsAppUrl(r.recipientPhone, r.draftMessage),
    }));

    return { items: enriched, total, limit, offset };
  }
}
