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

    // Extract requested franchiseId and branchId from params, query, or body
    const targetFranchiseId =
      request.params.franchiseId || request.query.franchiseId || request.body?.franchiseId;
    const targetBranchId =
      request.params.branchId || request.query.branchId || request.body?.branchId;

    // Check Franchise Scope
    if (targetFranchiseId && user.assignedFranchiseId) {
      if (user.assignedFranchiseId !== targetFranchiseId) {
        throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access attempt');
      }
    }

    // Check Branch Scope
    if (targetBranchId && user.assignedBranchId) {
      // If user is Franchise Owner/Manager, they are allowed access to any branch in their franchise
      const isFranchiseLevel = user.roles.some((r: string) =>
        ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r),
      );

      if (!isFranchiseLevel && user.assignedBranchId !== targetBranchId) {
        throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access attempt');
      }
    }

    return true;
  }
}
