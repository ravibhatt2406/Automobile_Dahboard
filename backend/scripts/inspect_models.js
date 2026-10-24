const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const m = await prisma.manufacturer.findMany({
    include: {
      truckModels: {
        include: {
          truckVariants: true
        }
      }
    }
  });
  console.log(JSON.stringify(m.map(item => ({
    name: item.name,
    code: item.code,
    models: item.truckModels.map(mod => ({
      name: mod.name,
      code: mod.code,
      variants: mod.truckVariants.map(v => ({ name: v.name, code: v.code, price: v.basePrice }))
    }))
  })), null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
