const { PrismaClient } = require('@prisma/client');

async function compareDatabases() {
  const activePrisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://titan_admin:titan_secure_pass@localhost:5432/titan_auto_db?schema=public' } }
  });
  const restoredPrisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://titan_admin:titan_secure_pass@localhost:5432/titan_backup_verify_db?schema=public' } }
  });

  const tablesQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  const activeTablesRes = await activePrisma.$queryRawUnsafe(tablesQuery);
  const activeTables = activeTablesRes.map(r => r.table_name);

  const restoredTablesRes = await restoredPrisma.$queryRawUnsafe(tablesQuery);
  const restoredTables = restoredTablesRes.map(r => r.table_name);

  console.log(`Active Database Table Count:   ${activeTables.length}`);
  console.log(`Restored Database Table Count: ${restoredTables.length}`);

  let matches = 0;
  let mismatches = 0;
  const comparison = [];

  for (const table of activeTables) {
    const c1 = await activePrisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${table}"`);
    const c2 = await restoredPrisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${table}"`);

    const count1 = c1[0].count;
    const count2 = c2[0].count;
    const isMatch = count1 === count2;

    if (isMatch) matches++; else mismatches++;
    comparison.push({
      table,
      active: count1,
      restored: count2,
      match: isMatch ? 'YES' : 'NO'
    });
  }

  console.table(comparison);
  console.log(`\nComparison Summary: ${matches} tables matched perfectly, ${mismatches} mismatches.`);

  // Verify Super Admin in restored database
  const sa = await restoredPrisma.user.findUnique({
    where: { email: 'admin@titanauto.com' },
    select: { id: true, email: true, accountType: true, status: true, createdAt: true }
  });
  console.log('Restored Super Admin:', sa);

  await activePrisma.$disconnect();
  await restoredPrisma.$disconnect();
}

compareDatabases().catch(console.error);
