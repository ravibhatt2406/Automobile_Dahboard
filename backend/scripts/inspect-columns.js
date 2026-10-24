const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'franchises'
    ORDER BY ordinal_position;
  `;
  console.log('Columns in franchises table:', columns);

  const branchColumns = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'branches'
    ORDER BY ordinal_position;
  `;
  console.log('Columns in branches table:', branchColumns);
}

main().finally(() => prisma.$disconnect());
