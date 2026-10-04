const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const dbIdentity = await prisma.$queryRawUnsafe(
      'SELECT current_database(), current_schema(), inet_server_addr(), inet_server_port()'
    );
    console.log('=== DB IDENTITY ===');
    console.log(dbIdentity);

    const franchiseCount = await prisma.franchise.count();
    const branchCount = await prisma.branch.count();
    const userCount = await prisma.user.count();
    const employeeCount = await prisma.employee.count();
    const approvalCount = await prisma.employeeApprovalRequest.count();
    const notifCount = await prisma.notification.count();

    console.log('\n=== TABLE COUNTS ===');
    console.log({
      franchises: franchiseCount,
      branches: branchCount,
      users: userCount,
      employees: employeeCount,
      approvalRequests: approvalCount,
      notifications: notifCount,
    });

    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    console.log('\n=== RECENT BRANCHES ===');
    console.log(JSON.stringify(branches, null, 2));

    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, email: true, status: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
    console.log('\n=== RECENT EMPLOYEES ===');
    console.log(JSON.stringify(employees, null, 2));
  } catch (err) {
    console.error('\n=== DB ERROR ===');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
