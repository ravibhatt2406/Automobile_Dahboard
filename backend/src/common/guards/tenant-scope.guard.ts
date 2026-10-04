import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User session context missing');
    }

    // Super Admin has global scope access across all tenants
    if (user.roles && user.roles.includes('SUPER_ADMIN')) {
      return true;
    }

    const isFranchiseLevel = user.roles && user.roles.some((r: string) =>
      ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r),
    );

    // Extract requested franchiseId and branchId from params, query, or body
    const targetFranchiseId =
      request.params?.franchiseId || request.query?.franchiseId || request.body?.franchiseId;
    const targetBranchId =
      request.params?.branchId || request.query?.branchId || request.body?.branchId;

    // Check Franchise Scope
    if (targetFranchiseId && user.assignedFranchiseId) {
      if (user.assignedFranchiseId !== targetFranchiseId) {
        throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access attempt');
      }
    } else if (!targetFranchiseId && user.assignedFranchiseId && isFranchiseLevel) {
      if (request.query && !request.query.franchiseId) {
        request.query.franchiseId = user.assignedFranchiseId;
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
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access attempt');
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
