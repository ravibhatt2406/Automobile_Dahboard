import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class TenantScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // If user session is missing for protected route
      throw new ForbiddenException('User session context missing');
    }

    if (user.status && user.status !== 'ACTIVE') {
      throw new ForbiddenException(`User account is ${user.status}`);
    }

    const roles: string[] = Array.isArray(user.roles) ? user.roles : [];

    // Super Admin has global scope access across all tenants
    if (user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN')) {
      return true;
    }

    const isCustomer =
      user.accountType === 'CUSTOMER' ||
      (roles.includes('CUSTOMER') && !user.employeeProfile);

    // Customer Scope Enforcement
    if (isCustomer) {
      const customerId = user.customerProfile?.id || user.customerId;
      const targetCustomerId =
        request.params?.customerId ||
        request.query?.customerId ||
        request.body?.customerId;

      if (targetCustomerId && customerId && targetCustomerId !== customerId) {
        throw new ForbiddenException(
          'Multi-tenant scope violation: Unauthorized customer access attempt',
        );
      }

      if (request.query && !request.query.customerId && customerId) {
        request.query.customerId = customerId;
      }

      if (
        request.body &&
        typeof request.body === 'object' &&
        ['POST', 'PATCH', 'PUT'].includes(request.method) &&
        customerId
      ) {
        request.body.customerId = customerId;
      }

      return true;
    }

    const isFranchiseLevel = roles.some((r: string) =>
      ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r),
    );

    // Extract requested franchiseId and branchId from params, query, or body
    const targetFranchiseId =
      request.params?.franchiseId ||
      request.query?.franchiseId ||
      request.body?.franchiseId;

    const targetBranchId =
      request.params?.branchId ||
      request.query?.branchId ||
      request.body?.branchId;

    // Check Franchise Scope
    if (targetFranchiseId && user.assignedFranchiseId) {
      if (user.assignedFranchiseId !== targetFranchiseId) {
        throw new ForbiddenException(
          'Multi-tenant scope violation: Unauthorized franchise access attempt',
        );
      }
    } else if (!targetFranchiseId && user.assignedFranchiseId && isFranchiseLevel) {
      if (request.query && !request.query.franchiseId) {
        request.query.franchiseId = user.assignedFranchiseId;
      }
    }

    // Check Branch Scope for Franchise-level personnel
    if (isFranchiseLevel && targetBranchId && user.assignedFranchiseId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          OR: [{ id: targetBranchId }, { code: targetBranchId }],
        },
        select: { franchiseId: true },
      });
      if (branch && branch.franchiseId !== user.assignedFranchiseId) {
        throw new ForbiddenException(
          'Multi-tenant scope violation: Unauthorized branch access attempt',
        );
      }
    }

    // Check Branch Scope for Branch-level personnel
    if (user.assignedBranchId && !isFranchiseLevel) {
      if (targetBranchId && user.assignedBranchId !== targetBranchId) {
        const userBranchCode = user.employeeProfile?.branch?.code;
        if (userBranchCode && targetBranchId === userBranchCode) {
          if (request.body && typeof request.body === 'object') {
            request.body.branchId = user.assignedBranchId;
          }
          if (request.query) {
            request.query.branchId = user.assignedBranchId;
          }
        } else {
          throw new ForbiddenException(
            'Multi-tenant scope violation: Unauthorized branch access attempt',
          );
        }
      }

      // Automatically scope queries to assigned branch
      if (request.query && !request.query.branchId) {
        request.query.branchId = user.assignedBranchId;
      }

      // Automatically lock body payloads to assigned branch
      if (
        request.body &&
        typeof request.body === 'object' &&
        ['POST', 'PATCH', 'PUT'].includes(request.method)
      ) {
        request.body.branchId = user.assignedBranchId;
      }
    }

    return true;
  }
}
