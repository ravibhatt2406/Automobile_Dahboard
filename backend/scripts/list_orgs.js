const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const f = await prisma.franchise.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      createdAt: true,
      branches: {
        select: { id: true, code: true, name: true, city: true, state: true, status: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
  console.log(JSON.stringify(f, null, 2));
  await prisma.$disconnect();
}
main();
