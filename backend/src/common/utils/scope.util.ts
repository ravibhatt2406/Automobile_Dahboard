import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

export interface EffectiveScope {
  userId: string;
  isRealSuperAdmin: boolean;
  isCustomer: boolean;
  assignedBranchId: string | null;
  assignedFranchiseId: string | null;
  activeRole: string;
  isActingSuperAdmin: boolean;
  isActingFranchiseLevel: boolean;
  isActingBranchLevel: boolean;
  effectiveFranchiseId: string | null;
  effectiveBranchId: string | null;
  isAllBranches: boolean;
  isAllFranchises: boolean;
}

export async function resolveUserScope(
  prisma: PrismaService,
  user: any,
  requestedBranchId?: string,
  requestedFranchiseId?: string,
  requestedRole?: string,
): Promise<EffectiveScope> {
  if (!user) {
    throw new ForbiddenException('User session context missing');
  }

  if (user.status && user.status !== 'ACTIVE') {
    throw new ForbiddenException(`User account is ${user.status}`);
  }

  const realRoles: string[] = Array.isArray(user.roles) ? user.roles : [];
  const isRealSuperAdmin =
    user.accountType === 'SUPER_ADMIN' || realRoles.includes('SUPER_ADMIN');
  const isCustomer =
    user.accountType === 'CUSTOMER' ||
    (realRoles.includes('CUSTOMER') && !user.employeeProfile);

  const assignedBranchId =
    user.assignedBranchId ||
    user.branchId ||
    user.employeeProfile?.branchId ||
    null;
  const assignedFranchiseId =
    user.assignedFranchiseId ||
    user.franchiseId ||
    user.employeeProfile?.branch?.franchiseId ||
    null;

  // 1. Resolve and Validate Active Role
  let activeRole = realRoles[0] || (isRealSuperAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE');
  if (requestedRole && typeof requestedRole === 'string' && requestedRole.trim()) {
    const cleanRole = requestedRole.trim().toUpperCase();

    // Ordinary user can NEVER elevate to SUPER_ADMIN
    if (cleanRole === 'SUPER_ADMIN' && !isRealSuperAdmin) {
      throw new ForbiddenException(
        'Server-side RBAC Violation: You do not possess SUPER_ADMIN authority.',
      );
    }

    if (isRealSuperAdmin) {
      // Super Admin may assume administrative view contexts
      activeRole = cleanRole;
    } else {
      // Non-super-admin can only assume assigned roles or legitimate subordinate roles
      const isFranchiseManagerOrOwner = realRoles.some((r) =>
        ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r),
      );
      const isBranchManagerOrOwner = realRoles.some((r) =>
        ['BRANCH_OWNER', 'BRANCH_MANAGER'].includes(r),
      );

      if (realRoles.includes(cleanRole)) {
        activeRole = cleanRole;
      } else if (
        isFranchiseManagerOrOwner &&
        ['BRANCH_MANAGER', 'SALES_EMPLOYEE', 'SERVICE_ADVISOR', 'MECHANIC'].includes(cleanRole)
      ) {
        activeRole = cleanRole;
      } else if (
        isBranchManagerOrOwner &&
        ['SALES_EMPLOYEE', 'SERVICE_ADVISOR', 'MECHANIC'].includes(cleanRole)
      ) {
        activeRole = cleanRole;
      } else {
        throw new ForbiddenException(
          `Unauthorized role switch attempt to '${cleanRole}'. Target role is not authorized.`,
        );
      }
    }
  }

  const isActingSuperAdmin = isRealSuperAdmin && activeRole === 'SUPER_ADMIN';
  const isActingFranchiseLevel = ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(activeRole);
  const isActingBranchLevel = !isActingSuperAdmin && !isActingFranchiseLevel && !isCustomer;

  // 2. Clean inputs
  const cleanBranch =
    requestedBranchId &&
    requestedBranchId !== 'ALL' &&
    requestedBranchId !== 'undefined' &&
    requestedBranchId.trim()
      ? requestedBranchId.trim()
      : null;

  const cleanFranchise =
    requestedFranchiseId &&
    requestedFranchiseId !== 'ALL' &&
    requestedFranchiseId !== 'undefined' &&
    requestedFranchiseId.trim()
      ? requestedFranchiseId.trim()
      : null;

  let effectiveFranchiseId: string | null = null;
  let effectiveBranchId: string | null = null;

  // 3. Resolve Scope based on Authenticated Identity & Active Role
  if (isCustomer) {
    // Customer is strictly scoped to customer identity
    effectiveBranchId = null;
    effectiveFranchiseId = null;
  } else if (isRealSuperAdmin) {
    if (isActingSuperAdmin) {
      // Global Super Admin context
      if (cleanFranchise) {
        const f = await prisma.franchise.findFirst({
          where: { OR: [{ id: cleanFranchise }, { code: cleanFranchise }] },
          select: { id: true },
        });
        if (!f) throw new NotFoundException(`Franchise '${cleanFranchise}' not found`);
        effectiveFranchiseId = f.id;

        if (cleanBranch) {
          const b = await prisma.branch.findFirst({
            where: { OR: [{ id: cleanBranch }, { code: cleanBranch }] },
            select: { id: true, franchiseId: true },
          });
          if (!b) throw new NotFoundException(`Branch '${cleanBranch}' not found`);
          if (b.franchiseId !== effectiveFranchiseId) {
            throw new BadRequestException('Selected branch does not belong to the selected franchise');
          }
          effectiveBranchId = b.id;
        }
      } else if (cleanBranch) {
        const b = await prisma.branch.findFirst({
          where: { OR: [{ id: cleanBranch }, { code: cleanBranch }] },
          select: { id: true, franchiseId: true },
        });
        if (!b) throw new NotFoundException(`Branch '${cleanBranch}' not found`);
        effectiveBranchId = b.id;
        effectiveFranchiseId = b.franchiseId;
      }
    } else if (isActingFranchiseLevel) {
      // Super Admin viewing as Franchise Owner / Manager
      if (cleanFranchise) {
        const f = await prisma.franchise.findFirst({
          where: { OR: [{ id: cleanFranchise }, { code: cleanFranchise }] },
          select: { id: true },
        });
        if (!f) throw new NotFoundException(`Franchise '${cleanFranchise}' not found`);
        effectiveFranchiseId = f.id;
      } else if (assignedFranchiseId) {
        effectiveFranchiseId = assignedFranchiseId;
      } else {
        const firstF = await prisma.franchise.findFirst({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });
        effectiveFranchiseId = firstF?.id || null;
      }

      if (cleanBranch && effectiveFranchiseId) {
        const b = await prisma.branch.findFirst({
          where: { OR: [{ id: cleanBranch }, { code: cleanBranch }] },
          select: { id: true, franchiseId: true },
        });
        if (!b) throw new NotFoundException(`Branch '${cleanBranch}' not found`);
        if (b.franchiseId !== effectiveFranchiseId) {
          throw new BadRequestException('Selected branch does not belong to the selected franchise');
        }
        effectiveBranchId = b.id;
      }
    } else {
      // Super Admin viewing as Branch Manager or branch personnel
      if (cleanBranch) {
        const b = await prisma.branch.findFirst({
          where: { OR: [{ id: cleanBranch }, { code: cleanBranch }] },
          select: { id: true, franchiseId: true },
        });
        if (!b) throw new NotFoundException(`Branch '${cleanBranch}' not found`);
        effectiveBranchId = b.id;
        effectiveFranchiseId = b.franchiseId;
      } else if (assignedBranchId) {
        effectiveBranchId = assignedBranchId;
        effectiveFranchiseId = assignedFranchiseId;
      } else {
        const firstB = await prisma.branch.findFirst({
          where: { status: 'ACTIVE' },
          select: { id: true, franchiseId: true },
        });
        effectiveBranchId = firstB?.id || null;
        effectiveFranchiseId = firstB?.franchiseId || null;
      }
    }
  } else if (isActingFranchiseLevel) {
    // Authentic Franchise Level user
    if (!assignedFranchiseId) {
      throw new ForbiddenException('User is not assigned to any franchise');
    }

    if (cleanFranchise && cleanFranchise !== assignedFranchiseId) {
      const f = await prisma.franchise.findFirst({
        where: { OR: [{ id: cleanFranchise }, { code: cleanFranchise }] },
        select: { id: true },
      });
      if (f?.id !== assignedFranchiseId) {
        throw new ForbiddenException(
          'Multi-tenant scope violation: Unauthorized franchise access attempt',
        );
      }
    }
    effectiveFranchiseId = assignedFranchiseId;

    if (cleanBranch) {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: cleanBranch }, { code: cleanBranch }] },
        select: { id: true, franchiseId: true },
      });
      if (!b || b.franchiseId !== assignedFranchiseId) {
        throw new ForbiddenException(
          'Multi-tenant scope violation: Unauthorized branch access attempt',
        );
      }
      effectiveBranchId = b.id;
    }
  } else {
    // Authentic Branch Level user (Branch Manager, Sales, Mechanic, etc.)
    if (!assignedBranchId) {
      throw new ForbiddenException('User is not assigned to any branch');
    }

    if (cleanBranch) {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: cleanBranch }, { code: cleanBranch }] },
        select: { id: true, code: true },
      });
      if (!b || (b.id !== assignedBranchId && b.code !== assignedBranchId)) {
        throw new ForbiddenException(
          'Multi-tenant scope violation: Unauthorized branch access attempt',
        );
      }
    }

    if (cleanFranchise && assignedFranchiseId) {
      const f = await prisma.franchise.findFirst({
        where: { OR: [{ id: cleanFranchise }, { code: cleanFranchise }] },
        select: { id: true },
      });
      if (f?.id !== assignedFranchiseId) {
        throw new ForbiddenException(
          'Multi-tenant scope violation: Unauthorized franchise access attempt',
        );
      }
    }

    effectiveBranchId = assignedBranchId;
    effectiveFranchiseId = assignedFranchiseId;
  }

  return {
    userId: user.id,
    isRealSuperAdmin,
    isCustomer,
    assignedBranchId,
    assignedFranchiseId,
    activeRole,
    isActingSuperAdmin,
    isActingFranchiseLevel,
    isActingBranchLevel,
    effectiveFranchiseId,
    effectiveBranchId,
    isAllBranches: effectiveBranchId === null,
    isAllFranchises: effectiveFranchiseId === null,
  };
}
