import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Titan Auto Phase 1 Seed Process...');

  // 1. Seed System Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Global Platform Super Admin', rank: 1 },
    { name: 'FRANCHISE_OWNER', description: 'Franchise Owner Executive', rank: 2 },
    { name: 'FRANCHISE_MANAGER', description: 'Franchise Regional Manager', rank: 3 },
    { name: 'BRANCH_OWNER', description: 'Branch Dealership Owner', rank: 4 },
    { name: 'BRANCH_MANAGER', description: 'Branch Dealership Manager', rank: 5 },
    { name: 'DEPARTMENT_MANAGER', description: 'Department Manager', rank: 6 },
    { name: 'EMPLOYEE', description: 'General Operational Staff', rank: 7 },
    { name: 'CUSTOMER', description: 'Fleet Customer Account', rank: 99 },
  ];

  const roleMap: Record<string, string> = {};

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { rank: roleData.rank, description: roleData.description },
      create: {
        name: roleData.name,
        description: roleData.description,
        rank: roleData.rank,
        isSystem: true,
      },
    });
    roleMap[roleData.name] = role.id;
  }
  console.log(`✅ Seeded ${roles.length} system roles`);

  // 2. Seed System Permissions
  const permissions = [
    { name: 'franchise.create', module: 'franchise', description: 'Create new franchises' },
    { name: 'franchise.read', module: 'franchise', description: 'View franchise details' },
    { name: 'franchise.update', module: 'franchise', description: 'Update franchise configuration' },

    { name: 'branch.create', module: 'branch', description: 'Create new branch hubs' },
    { name: 'branch.read', module: 'branch', description: 'View branch details' },
    { name: 'branch.update', module: 'branch', description: 'Update branch configuration' },

    { name: 'employee.create', module: 'employee', description: 'Create employee accounts' },
    { name: 'employee.read', module: 'employee', description: 'View employee profiles' },
    { name: 'employee.update', module: 'employee', description: 'Update employee records' },
    { name: 'employee.approve', module: 'employee', description: 'Approve onboarding requests' },
    { name: 'employee.deactivate', module: 'employee', description: 'Deactivate employee accounts' },

    { name: 'customer.read', module: 'customer', description: 'View customer records' },
    { name: 'vehicle.read', module: 'inventory', description: 'View vehicle inventory' },
    { name: 'sales.read', module: 'sales', description: 'View sales data' },
    { name: 'service.read', module: 'service', description: 'View service jobs' },
    { name: 'reports.read', module: 'reports', description: 'View analytics reports' },
    { name: 'audit.read', module: 'audit', description: 'View system audit trail' },
  ];

  const permMap: Record<string, string> = {};

  for (const permData of permissions) {
    const perm = await prisma.permission.upsert({
      where: { name: permData.name },
      update: { description: permData.description, module: permData.module },
      create: {
        name: permData.name,
        description: permData.description,
        module: permData.module,
      },
    });
    permMap[permData.name] = perm.id;
  }
  console.log(`✅ Seeded ${permissions.length} granular permissions`);

  // 3. Seed Role-Permission Relationships
  const rolePermissionAssignments: Array<{ roleName: string; perms: string[] }> = [
    {
      roleName: 'SUPER_ADMIN',
      perms: Object.keys(permMap),
    },
    {
      roleName: 'FRANCHISE_OWNER',
      perms: [
        'franchise.read',
        'branch.create',
        'branch.read',
        'branch.update',
        'employee.create',
        'employee.read',
        'employee.update',
        'employee.approve',
        'employee.deactivate',
        'customer.read',
        'vehicle.read',
        'sales.read',
        'service.read',
        'reports.read',
      ],
    },
    {
      roleName: 'BRANCH_MANAGER',
      perms: [
        'branch.read',
        'employee.create',
        'employee.read',
        'employee.approve',
        'employee.deactivate',
        'customer.read',
        'vehicle.read',
        'sales.read',
        'service.read',
        'reports.read',
      ],
    },
    {
      roleName: 'CUSTOMER',
      perms: ['customer.read', 'vehicle.read'],
    },
  ];

  for (const assignment of rolePermissionAssignments) {
    const roleId = roleMap[assignment.roleName];
    if (!roleId) continue;

    for (const permName of assignment.perms) {
      const permissionId = permMap[permName];
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    }
  }
  console.log('✅ Configured Role-Permission matrices');

  // 4. Seed Development-only Franchise & Branch & Admin User
  const devPasswordHash = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@titanauto.com' },
    update: {},
    create: {
      email: 'admin@titanauto.com',
      passwordHash: devPasswordHash,
      accountType: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const devFranchise = await prisma.franchise.upsert({
    where: { code: 'FR-DEV-01' },
    update: {},
    create: {
      code: 'FR-DEV-01',
      name: 'Titan Commercial Global (DEV ONLY)',
      legalName: 'Titan Motors Ltd',
      taxId: 'US-DEV990',
    },
  });

  const devBranch = await prisma.branch.upsert({
    where: { code: 'BR-DEV-01' },
    update: {},
    create: {
      franchiseId: devFranchise.id,
      code: 'BR-DEV-01',
      name: 'Detroit Flagship Hub (DEV ONLY)',
      city: 'Detroit',
      state: 'MI',
    },
  });

  // Assign Super Admin Employee Profile
  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      branchId: devBranch.id,
      employeeCode: 'EMP-ADM-001',
      firstName: 'Alexander',
      lastName: 'Vance',
      designation: 'Global Platform Admin',
      status: 'ACTIVE',
      roleAssignments: {
        create: {
          roleId: roleMap['SUPER_ADMIN'],
        },
      },
    },
  });

  console.log('✅ Seeded development super admin: admin@titanauto.com / Admin123!');
  console.log('🌱 Phase 1 Seed Process Complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
