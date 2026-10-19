import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationStatus, MessageSenderType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private async resolveUserRoleAndScope(user: any) {
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const scope = user?.effectiveScope;
    const isSuperAdmin = scope ? scope.isActingSuperAdmin : (user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN'));
    const isCustomer = scope ? scope.isCustomer : (user?.accountType === 'CUSTOMER' || (roles.includes('CUSTOMER') && !user?.employeeProfile));
    const isFranchiseLevel = scope ? scope.isActingFranchiseLevel : roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
    const isBranchManager = scope ? scope.isActingBranchLevel : roles.some((r) => ['BRANCH_OWNER', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER'].includes(r));

    let customerId: string | null = null;
    let employeeId: string | null = null;
    let branchId: string | null = scope?.effectiveBranchId || null;
    let franchiseId: string | null = scope?.effectiveFranchiseId || null;

    if (isCustomer) {
      const customer = await this.prisma.customer.findFirst({
        where: { userId: user.id },
      });
      customerId = customer?.id || user.customerId || null;
    } else {
      const employee = await this.prisma.employee.findFirst({
        where: { userId: user.id },
        include: { branch: true },
      });
      employeeId = employee?.id || user.employeeProfile?.id || null;
      if (!branchId) {
        branchId = employee?.branchId || user.assignedBranchId || user.branchId || null;
      }
      if (!franchiseId) {
        franchiseId = employee?.branch?.franchiseId || user.assignedFranchiseId || user.franchiseId || null;
      }
    }

    return {
      isSuperAdmin,
      isCustomer,
      isFranchiseLevel,
      isBranchManager,
      customerId,
      employeeId,
      branchId,
      franchiseId,
    };
  }

  async createOrGetConversation(dto: CreateConversationDto, user: any) {
    const scope = await this.resolveUserRoleAndScope(user);

    let effectiveCustomerId: string;

    if (scope.isCustomer) {
      if (!scope.customerId) {
        throw new ForbiddenException('Authenticated user is not registered as a customer');
      }
      effectiveCustomerId = scope.customerId;
    } else {
      if (!dto.customerId) {
        throw new BadRequestException('customerId is required when initiating conversation as an employee');
      }
      const cust = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!cust) {
        throw new NotFoundException(`Customer ID '${dto.customerId}' not found`);
      }
      effectiveCustomerId = dto.customerId;
    }

    // Validate branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
      include: { franchise: true },
    });
    if (!branch) {
      throw new NotFoundException(`Branch ID '${dto.branchId}' not found`);
    }

    // Branch isolation for employees
    if (!scope.isCustomer && !scope.isSuperAdmin) {
      if (scope.isFranchiseLevel) {
        if (scope.franchiseId && branch.franchiseId !== scope.franchiseId) {
          throw new ForbiddenException('Cannot open conversation for a branch in another franchise');
        }
      } else {
        if (scope.branchId && branch.id !== scope.branchId) {
          throw new ForbiddenException('Cannot open conversation for another branch');
        }
      }
    }

    const contextType = dto.contextType?.trim().toUpperCase() || 'GENERAL';
    const contextId = dto.contextId?.trim() || 'NONE';

    // Prevent duplicate conversations
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        customerId_branchId_contextType_contextId: {
          customerId: effectiveCustomerId,
          branchId: dto.branchId,
          contextType,
          contextId,
        },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, companyName: true } },
        branch: { select: { id: true, name: true, city: true, code: true, franchiseId: true } },
        assignedEmployee: { select: { id: true, firstName: true, lastName: true, designation: true } },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          customerId: effectiveCustomerId,
          branchId: dto.branchId,
          subject: dto.subject || (contextType !== 'GENERAL' ? `${contextType} Inquiry` : `Chat with ${branch.name}`),
          contextType,
          contextId,
          status: ConversationStatus.OPEN,
          lastMessageAt: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true, companyName: true } },
          branch: { select: { id: true, name: true, city: true, code: true, franchiseId: true } },
          assignedEmployee: { select: { id: true, firstName: true, lastName: true, designation: true } },
        },
      });
    }

    // If initialMessage was supplied, persist it
    if (dto.initialMessage && dto.initialMessage.trim()) {
      const senderType = scope.isCustomer ? MessageSenderType.CUSTOMER : MessageSenderType.EMPLOYEE;
      await this.prisma.$transaction(async (tx) => {
        await tx.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderUserId: user.id,
            senderType,
            message: dto.initialMessage!.trim(),
            isRead: false,
          },
        });
        await tx.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });
      });
    }

    return conversation;
  }

  async listConversations(params: { branchId?: string; search?: string }, user: any) {
    const scope = await this.resolveUserRoleAndScope(user);
    const where: any = {};

    if (scope.isCustomer) {
      if (!scope.customerId) {
        return { items: [], total: 0 };
      }
      where.customerId = scope.customerId;
    } else if (!scope.isSuperAdmin) {
      if (scope.isFranchiseLevel) {
        where.branch = { franchiseId: scope.franchiseId };
        if (params.branchId && params.branchId !== 'ALL') {
          where.branchId = params.branchId;
        }
      } else {
        // Enforce employee branch scope
        if (params.branchId && params.branchId !== 'ALL' && params.branchId !== scope.branchId) {
          throw new ForbiddenException('Cannot access conversations from another branch');
        }
        where.branchId = scope.branchId;
      }
    } else {
      // Super admin
      if (params.branchId && params.branchId !== 'ALL') {
        where.branchId = params.branchId;
      }
    }

    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      where.OR = [
        { subject: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
        { customer: { companyName: { contains: s, mode: 'insensitive' } } },
        { branch: { name: { contains: s, mode: 'insensitive' } } },
        { messages: { some: { message: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    const conversations = await this.prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, companyName: true } },
        branch: { select: { id: true, name: true, city: true, code: true, franchiseId: true } },
        assignedEmployee: { select: { id: true, firstName: true, lastName: true, designation: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, message: true, senderType: true, createdAt: true, isRead: true },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderType: scope.isCustomer ? MessageSenderType.EMPLOYEE : MessageSenderType.CUSTOMER,
                isRead: false,
              },
            },
          },
        },
      },
    });

    const items = conversations.map((c) => ({
      ...c,
      unreadCount: c._count.messages,
      lastMessage: c.messages[0] || null,
    }));

    return { items, total: items.length };
  }

  async getConversation(id: string, user: any) {
    const scope = await this.resolveUserRoleAndScope(user);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, companyName: true } },
        branch: { select: { id: true, name: true, city: true, code: true, franchiseId: true } },
        assignedEmployee: { select: { id: true, firstName: true, lastName: true, designation: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ID '${id}' not found`);
    }

    // Security & Scope validation on every read
    if (scope.isCustomer) {
      if (conversation.customerId !== scope.customerId) {
        throw new ForbiddenException('Access denied to conversation: Customer ownership violation');
      }
    } else if (!scope.isSuperAdmin) {
      if (scope.isFranchiseLevel) {
        if (scope.franchiseId && conversation.branch.franchiseId !== scope.franchiseId) {
          throw new ForbiddenException('Access denied to conversation in another franchise');
        }
      } else {
        if (scope.branchId && conversation.branchId !== scope.branchId) {
          throw new ForbiddenException('Access denied to conversation in another branch');
        }
      }
    }

    // Fetch messages ordered chronologically
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        senderUser: {
          select: { id: true, email: true, accountType: true },
        },
      },
    });

    // Mark unread messages sent by counterparty as read
    const counterPartyType = scope.isCustomer ? MessageSenderType.EMPLOYEE : MessageSenderType.CUSTOMER;
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId: id,
        senderType: counterPartyType,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    }).catch(() => {});

    return {
      ...conversation,
      messages,
    };
  }

  async sendMessage(id: string, dto: SendMessageDto, user: any) {
    const scope = await this.resolveUserRoleAndScope(user);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ID '${id}' not found`);
    }

    // Security & Scope validation on every write
    if (scope.isCustomer) {
      if (conversation.customerId !== scope.customerId) {
        throw new ForbiddenException('Cannot send message: Customer ownership violation');
      }
    } else if (!scope.isSuperAdmin) {
      if (scope.isFranchiseLevel) {
        if (scope.franchiseId && conversation.branch.franchiseId !== scope.franchiseId) {
          throw new ForbiddenException('Cannot send message to conversation in another franchise');
        }
      } else {
        if (scope.branchId && conversation.branchId !== scope.branchId) {
          throw new ForbiddenException('Cannot send message to conversation in another branch');
        }
      }
    }

    const senderType = scope.isCustomer ? MessageSenderType.CUSTOMER : MessageSenderType.EMPLOYEE;

    // Persist message to database before acknowledging delivery
    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          conversationId: id,
          senderUserId: user.id,
          senderType,
          message: dto.message.trim(),
          isRead: false,
        },
        include: {
          senderUser: { select: { id: true, email: true, accountType: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  async assignConversation(id: string, employeeId: string, user: any) {
    const scope = await this.resolveUserRoleAndScope(user);

    if (scope.isCustomer) {
      throw new ForbiddenException('Customers cannot assign conversations');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation ID '${id}' not found`);
    }

    // Verify employee manager permissions and branch scope
    if (!scope.isSuperAdmin) {
      if (scope.branchId && conversation.branchId !== scope.branchId) {
        throw new ForbiddenException('Cannot assign conversation for another branch');
      }
    }

    // Verify target employee belongs to the conversation branch and is ACTIVE
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { branch: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ID '${employeeId}' not found`);
    }
    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException(`Employee is not ACTIVE (current status: ${employee.status})`);
    }
    if (employee.branchId !== conversation.branchId) {
      throw new BadRequestException('Assigned employee must belong to the same branch as the conversation');
    }

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        assignedEmployeeId: employeeId,
        status: ConversationStatus.ASSIGNED,
      },
      include: {
        customer: true,
        branch: true,
        assignedEmployee: true,
      },
    });

    return updated;
  }

  async getUnreadCount(user: any) {
    const scope = await this.resolveUserRoleAndScope(user);
    if (scope.isCustomer) {
      if (!scope.customerId) return { unreadCount: 0 };
      const count = await this.prisma.chatMessage.count({
        where: {
          conversation: { customerId: scope.customerId },
          senderType: MessageSenderType.EMPLOYEE,
          isRead: false,
        },
      });
      return { unreadCount: count };
    } else {
      const whereConv: any = {};
      if (!scope.isSuperAdmin) {
        if (scope.isFranchiseLevel) {
          whereConv.branch = { franchiseId: scope.franchiseId };
        } else {
          whereConv.branchId = scope.branchId;
        }
      }
      const count = await this.prisma.chatMessage.count({
        where: {
          conversation: whereConv,
          senderType: MessageSenderType.CUSTOMER,
          isRead: false,
        },
      });
      return { unreadCount: count };
    }
  }
}
