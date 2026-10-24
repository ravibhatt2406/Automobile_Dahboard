const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const superAdmins = await prisma.user.findMany({
    where: { accountType: 'SUPER_ADMIN' },
    select: {
      id: true,
      email: true,
      phone: true,
      status: true,
      accountType: true,
      createdAt: true
    }
  });
  console.log('--- SUPER ADMIN ACCOUNTS ---');
  console.log(JSON.stringify(superAdmins, null, 2));

  const systemUsers = await prisma.user.findMany({
    where: {
      email: { in: ['admin@titanauto.com', 'superadmin@titanauto.com', 'admin@titan.com'] }
    },
    select: {
      id: true,
      email: true,
      accountType: true,
      status: true
    }
  });
  console.log('--- STANDARD ADMIN ACCOUNTS ---');
  console.log(JSON.stringify(systemUsers, null, 2));

  await prisma.$disconnect();
}
main();
