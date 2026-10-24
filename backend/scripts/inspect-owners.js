const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findFirst({
    where: { user: { email: 'franchise.ashok@titanauto.com' } },
    include: { user: true, branch: true }
  });
  console.log('Ashok Franchise Owner Employee:', emp);

  const tataEmp = await prisma.employee.findFirst({
    where: { user: { email: 'franchise.tata@titanauto.com' } },
    include: { user: true, branch: true }
  });
  console.log('Tata Franchise Owner Employee:', tataEmp);
}

main().finally(() => prisma.$disconnect());
