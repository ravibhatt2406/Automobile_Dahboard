const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const franchises = await prisma.franchise.findMany({
    include: {
      branches: true
    }
  });
  franchises.forEach(f => {
    console.log('Franchise:', f.code, f.name, f.id, 'status:', f.status, 'legalName:', f.legalName, 'taxId:', f.taxId);
    console.log('  Branches (' + f.branches.length + '):');
    f.branches.forEach(b => {
      console.log('    Branch:', b.code, b.name, b.id, b.city, b.state, b.phone, b.email, b.status);
    });
  });
}

main().finally(() => prisma.$disconnect());
