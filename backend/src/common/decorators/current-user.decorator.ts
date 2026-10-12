import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;

    if (data === 'employeeId') {
      return user.employeeId || user.employee?.id || user.employeeProfile?.id;
    }
    if (data === 'customerId') {
      return user.customerId || user.customer?.id || user.customerProfile?.id;
    }
    if (data === 'branchId') {
      return user.branchId || user.assignedBranchId || user.employeeProfile?.branchId;
    }
    if (data === 'franchiseId') {
      return user.franchiseId || user.assignedFranchiseId || user.employeeProfile?.branch?.franchiseId;
    }
    if (data === 'employee') {
      return user.employee || user.employeeProfile;
    }
    if (data === 'customer') {
      return user.customer || user.customerProfile;
    }
    if (data === 'branch') {
      return user.branch || user.employeeProfile?.branch;
    }
    if (data === 'franchise') {
      return user.franchise || user.employeeProfile?.branch?.franchise;
    }

    return data ? user[data] : user;
  },
);
