import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '@/database/prisma.service';
import { resolveUserScope } from '../utils/scope.util';

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
      throw new ForbiddenException('User session context missing');
    }

    if (user.status && user.status !== 'ACTIVE') {
      throw new ForbiddenException(`User account is ${user.status}`);
    }

    const requestedRole =
      request.headers['x-active-role'] ||
      request.headers['x-role'];

    const targetBranchId =
      request.headers['x-active-branch-id'] ||
      request.params?.branchId ||
      request.query?.branchId ||
      request.body?.branchId;

    const targetFranchiseId =
      request.headers['x-active-franchise-id'] ||
      request.params?.franchiseId ||
      request.query?.franchiseId ||
      request.body?.franchiseId;

    // Authoritative server-side scope resolution
    const effectiveScope = await resolveUserScope(
      this.prisma,
      user,
      targetBranchId,
      targetFranchiseId,
      requestedRole,
    );

    // Attach to user context for all downstream controllers & services
    user.effectiveScope = effectiveScope;
    request.user = user;

    // Customer Scope Enforcement
    if (effectiveScope.isCustomer) {
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

    const url = request.url || '';
    const isSubResourceAction =
      url.includes('/messages') ||
      url.includes('/assign') ||
      url.includes('/cancel') ||
      url.includes('/verify') ||
      url.includes('/status');

    // Branch locking for branch-scoped requests
    if (effectiveScope.effectiveBranchId) {
      if (
        request.body &&
        typeof request.body === 'object' &&
        ['POST', 'PATCH', 'PUT'].includes(request.method) &&
        !effectiveScope.isActingSuperAdmin &&
        (!isSubResourceAction || 'branchId' in request.body)
      ) {
        request.body.branchId = effectiveScope.effectiveBranchId;
      }

      if (request.query && !request.query.branchId && !effectiveScope.isActingSuperAdmin) {
        request.query.branchId = effectiveScope.effectiveBranchId;
      }
    }

    // Franchise locking
    if (effectiveScope.effectiveFranchiseId) {
      if (
        request.body &&
        typeof request.body === 'object' &&
        ['POST', 'PATCH', 'PUT'].includes(request.method) &&
        !effectiveScope.isActingSuperAdmin &&
        (!isSubResourceAction || 'franchiseId' in request.body)
      ) {
        request.body.franchiseId = effectiveScope.effectiveFranchiseId;
      }

      if (request.query && !request.query.franchiseId && !effectiveScope.isActingSuperAdmin) {
        request.query.franchiseId = effectiveScope.effectiveFranchiseId;
      }
    }

    return true;
  }
}
