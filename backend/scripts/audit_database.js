const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function audit() {
  const result = {
    timestamp: new Date().toISOString(),
    tableCounts: {},
    franchises: [],
    branches: [],
    users: [],
    foreignKeyConstraints: [],
  };

  // 1. Table Counts
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  for (const t of tables) {
    const tableName = t.table_name;
    try {
      const res = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${tableName}"`);
      result.tableCounts[tableName] = res[0].count;
    } catch (e) {
      result.tableCounts[tableName] = `ERROR: ${e.message}`;
    }
  }

  // 2. Existing Franchises
  result.franchises = await prisma.franchise.findMany({
    include: {
      branches: {
        select: { id: true, code: true, name: true, city: true, state: true, status: true }
      },
      _count: {
        select: {
          branches: true,
          leads: true,
          quotations: true,
          announcements: true,
          campaigns: true,
          invoices: true,
        }
      }
    }
  });

  // 3. Existing Branches
  result.branches = await prisma.branch.findMany({
    include: {
      franchise: { select: { id: true, name: true, code: true } },
      _count: {
        select: {
          employees: true,
          vehicles: true,
          bookings: true,
          serviceJobs: true,
          leads: true,
          quotations: true,
          invoices: true,
          campaigns: true,
          partStocks: true,
        }
      }
    }
  });

  // 4. Key Users & Super Admin
  result.users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      accountType: true,
      status: true,
      createdAt: true,
      employeeProfile: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          designation: true,
          branchId: true,
          branch: { select: { id: true, name: true, franchiseId: true, franchise: { select: { id: true, name: true } } } },
          roleAssignments: {
            include: { role: { select: { id: true, name: true, rank: true } } }
          }
        }
      },
      customerProfile: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          preferredBranchId: true
        }
      }
    }
  });

  // 5. Foreign Key References to Franchise and Branch
  result.foreignKeyConstraints = await prisma.$queryRaw`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name IN ('franchises', 'branches')
    ORDER BY ccu.table_name, tc.table_name;
  `;

  const outputPath = path.join(__dirname, 'audit_summary.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Audit saved to ${outputPath}`);
  console.log(`Total Tables: ${tables.length}`);
  console.log(`Total Franchises: ${result.franchises.length}`);
  console.log(`Total Branches: ${result.branches.length}`);
  console.log(`Total Users: ${result.users.length}`);

  await prisma.$disconnect();
}

audit().catch((err) => {
  console.error('Audit failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
