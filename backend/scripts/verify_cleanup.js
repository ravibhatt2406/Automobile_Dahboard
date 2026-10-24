const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('TITAN AUTO — POST-CLEANUP DATA INTEGRITY AUDIT');
  console.log('===============================================================');

  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  console.log(`Auditing all ${tables.length} tables in titan_auto_db:\n`);

  const results = [];
  for (const t of tables) {
    const tableName = t.table_name;
    const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${tableName}"`);
    results.push({ table: tableName, count: countRes[0].count });
  }

  console.table(results);

  // Check Franchises
  const franchises = await prisma.franchise.findMany({
    include: {
      branches: true,
    },
  });

  console.log(`\nActive Franchises Count: ${franchises.length}`);
  franchises.forEach(f => {
    console.log(`  - Franchise: "${f.name}" (${f.code}, ID: ${f.id})`);
    f.branches.forEach(b => {
      console.log(`      * Branch: "${b.name}" (${b.city}, ${b.state}, ID: ${b.id})`);
    });
  });

  // Check Super Admin
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@titanauto.com' },
  });
  console.log(`\nSuper Admin Status: ${admin ? '✅ ACTIVE (' + admin.id + ')' : '❌ MISSING'}`);

  // Check Branch breakdown for core modules
  const branches = await prisma.branch.findMany();
  console.log('\n--- MODULE BREAKDOWN PER BRANCH ---');
  for (const b of branches) {
    const vehCount = await prisma.vehicle.count({ where: { branchId: b.id } });
    const leadCount = await prisma.lead.count({ where: { branchId: b.id } });
    const quoteCount = await prisma.quotation.count({ where: { branchId: b.id } });
    const bookCount = await prisma.booking.count({ where: { branchId: b.id } });
    const invCount = await prisma.invoice.count({ where: { branchId: b.id } });
    const aptCount = await prisma.serviceAppointment.count({ where: { branchId: b.id } });
    const jobCount = await prisma.serviceJob.count({ where: { branchId: b.id } });
    const campCount = await prisma.campaign.count({ where: { branchId: b.id } });
    const annCount = await prisma.announcement.count({ where: { branchId: b.id } });
    const remCount = await prisma.customerReminder.count({ where: { branchId: b.id } });
    const empCount = await prisma.employee.count({ where: { branchId: b.id } });
    const custCount = await prisma.customer.count({ where: { preferredBranchId: b.id } });

    console.log(`\nBranch: ${b.name}`);
    console.log(`  - Employees: ${empCount}`);
    console.log(`  - Customers: ${custCount}`);
    console.log(`  - Vehicles: ${vehCount}`);
    console.log(`  - Leads: ${leadCount}`);
    console.log(`  - Quotations: ${quoteCount}`);
    console.log(`  - Bookings: ${bookCount}`);
    console.log(`  - Invoices: ${invCount}`);
    console.log(`  - Appointments: ${aptCount}`);
    console.log(`  - Service Jobs: ${jobCount}`);
    console.log(`  - Campaigns: ${campCount}`);
    console.log(`  - Announcements: ${annCount}`);
    console.log(`  - Reminders: ${remCount}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
