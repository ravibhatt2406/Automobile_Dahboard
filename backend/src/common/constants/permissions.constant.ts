export const PERMISSIONS = {
  FRANCHISE_CREATE: 'franchise.create',
  FRANCHISE_READ: 'franchise.read',
  FRANCHISE_UPDATE: 'franchise.update',

  BRANCH_CREATE: 'branch.create',
  BRANCH_READ: 'branch.read',
  BRANCH_UPDATE: 'branch.update',

  EMPLOYEE_CREATE: 'employee.create',
  EMPLOYEE_READ: 'employee.read',
  EMPLOYEE_UPDATE: 'employee.update',
  EMPLOYEE_APPROVE: 'employee.approve',
  EMPLOYEE_DEACTIVATE: 'employee.deactivate',

  CUSTOMER_READ: 'customer.read',
  VEHICLE_READ: 'vehicle.read',
  SALES_READ: 'sales.read',
  SERVICE_READ: 'service.read',
  REPORTS_READ: 'reports.read',
  AUDIT_READ: 'audit.read',
} as const;

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  FRANCHISE_OWNER: 'FRANCHISE_OWNER',
  FRANCHISE_MANAGER: 'FRANCHISE_MANAGER',
  BRANCH_OWNER: 'BRANCH_OWNER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  DEPARTMENT_MANAGER: 'DEPARTMENT_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  CUSTOMER: 'CUSTOMER',
} as const;

export const ROLE_RANKS: Record<string, number> = {
  SUPER_ADMIN: 1,
  FRANCHISE_OWNER: 2,
  FRANCHISE_MANAGER: 3,
  BRANCH_OWNER: 4,
  BRANCH_MANAGER: 5,
  DEPARTMENT_MANAGER: 6,
  EMPLOYEE: 7,
  SALES_EMPLOYEE: 7,
  MECHANIC: 7,
  CUSTOMER: 99,
};
