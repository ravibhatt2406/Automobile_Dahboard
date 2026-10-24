const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      employeeProfile: {
        include: {
          branch: { include: { franchise: true } },
          roleAssignments: { include: { role: true } }
        }
      }
    }
  });

  console.log('=== USERS ===');
  users.forEach(u => {
    const roles = u.employeeProfile?.roleAssignments?.map(ra => ra.role.name) || [u.accountType];
    const branch = u.employeeProfile?.branch?.name;
    const franchise = u.employeeProfile?.branch?.franchise?.name;
    console.log(u.email, '| Phone:', u.phone, '| AccountType:', u.accountType, '| Roles:', roles, '| Branch:', branch, '| Franchise:', franchise);
  });
}

main().finally(() => prisma.$disconnect());
