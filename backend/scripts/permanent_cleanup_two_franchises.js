const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_FRANCHISE_CODES = ['FR-TATA-01', 'FR-AL-01'];
const TARGET_BRANCH_CODES = ['BR-UDR-01', 'BR-JAI-01'];

const PRESERVED_USER_EMAILS = [
  'admin@titanauto.com',
  'ravibhatt2406@gmail.com',
  'rajbhatt2406@gmail.com',
  'ravibhatt.ai29@jecrc.ac.in',
  'franchise.tata@titanauto.com',
  'bm.udaipur@titanauto.com',
  'sales.udaipur@titanauto.com',
  'advisor.udaipur@titanauto.com',
  'mechanic.udaipur@titanauto.com',
  'franchise.ashok@titanauto.com',
  'bm.jaipur@titanauto.com',
  'sales.jaipur@titanauto.com',
  'advisor.jaipur@titanauto.com',
  'mechanic.jaipur@titanauto.com',
  'mewar.mining@fleet.in',
  'udaipur.marble@fleet.in',
  'jaipur.cargo@fleet.in',
  'pinkcity.transport@fleet.in',
];

async function main() {
  console.log('================================================================');
  console.log('TITAN AUTO — PERMANENT TWO-FRANCHISE CLEANUP (TRANSACTIONAL)');
  console.log('================================================================');

  // 1. Verify intended franchises & branches exist
  const intendedFranchises = await prisma.franchise.findMany({
    where: { code: { in: TARGET_FRANCHISE_CODES } },
    include: { branches: true },
  });

  if (intendedFranchises.length !== 2) {
    throw new Error(`Expected exactly 2 target franchises, found: ${intendedFranchises.length}`);
  }

  const tataFranchise = intendedFranchises.find(f => f.code === 'FR-TATA-01');
  const alFranchise = intendedFranchises.find(f => f.code === 'FR-AL-01');

  const udaipurBranch = tataFranchise.branches.find(b => b.code === 'BR-UDR-01');
  const jaipurBranch = alFranchise.branches.find(b => b.code === 'BR-JAI-01');

  if (!udaipurBranch || !jaipurBranch) {
    throw new Error('Target branches BR-UDR-01 or BR-JAI-01 missing!');
  }

  console.log(`✅ Preserving Target Franchise 1: ${tataFranchise.name} (${tataFranchise.code}) -> Branch: ${udaipurBranch.name} (${udaipurBranch.code})`);
  console.log(`✅ Preserving Target Franchise 2: ${alFranchise.name} (${alFranchise.code}) -> Branch: ${jaipurBranch.name} (${jaipurBranch.code})`);

  // 2. Safely reassign user rajbhatt2406@gmail.com's employee profile if pointing to a non-target branch
  const rajUser = await prisma.user.findFirst({
    where: { email: 'rajbhatt2406@gmail.com' },
    include: { employeeProfile: true },
  });
  if (rajUser?.employeeProfile && !TARGET_BRANCH_CODES.includes(rajUser.employeeProfile.branchId)) {
    console.log(`Reassigning rajbhatt2406@gmail.com employee branch from ${rajUser.employeeProfile.branchId} to Jaipur (${jaipurBranch.id})...`);
    await prisma.employee.update({
      where: { id: rajUser.employeeProfile.id },
      data: { branchId: jaipurBranch.id },
    });
  }

  // 3. Find all unwanted franchises and branches
  const unwantedFranchises = await prisma.franchise.findMany({
    where: { code: { notIn: TARGET_FRANCHISE_CODES } },
    select: { id: true, code: true, name: true },
  });
  const unwantedFranchiseIds = unwantedFranchises.map(f => f.id);

  const unwantedBranches = await prisma.branch.findMany({
    where: { code: { notIn: TARGET_BRANCH_CODES } },
    select: { id: true, code: true, name: true },
  });
  const unwantedBranchIds = unwantedBranches.map(b => b.id);

  console.log(`Found ${unwantedFranchises.length} unwanted franchises to delete.`);
  console.log(`Found ${unwantedBranches.length} unwanted branches to delete.`);

  // 4. Identify disposable test users
  const testUsers = await prisma.user.findMany({
    where: {
      email: { notIn: PRESERVED_USER_EMAILS },
      OR: [
        { email: { contains: '17930' } },
        { email: { contains: '17911' } },
        { email: { startsWith: 'bma-photo-' } },
        { email: { startsWith: 'bmb-photo-' } },
        { email: { startsWith: 'superadmin-p4-' } },
        { email: { startsWith: 'bma-p4-' } },
        { email: { startsWith: 'bmb-p4-' } },
        { email: { startsWith: 'customera-p4-' } },
        { email: { startsWith: 'customerb-p4-' } },
        { email: { startsWith: 'sales.179' } },
        { email: { startsWith: 'customer1.179' } },
        { email: { startsWith: 'customer2.179' } },
        { email: { startsWith: 'csv.' } },
        { email: { startsWith: 'worker.179' } },
        { email: { in: ['fleet@logistics.com', 'service@vanguard.com'] } },
      ],
    },
    select: { id: true, email: true },
  });
  const testUserIds = testUsers.map(u => u.id);
  console.log(`Found ${testUserIds.length} disposable test users.`);

  // 5. Execute atomic transaction
  console.log('\n--- EXECUTING ATOMIC CLEANUP TRANSACTION ---');
  await prisma.$transaction(async (tx) => {
    // A. Service records in non-target branches
    const delQc = await tx.serviceQc.deleteMany({
      where: { serviceJob: { branchId: { in: unwantedBranchIds } } },
    });
    const delAppr = await tx.serviceApproval.deleteMany({
      where: { serviceJob: { branchId: { in: unwantedBranchIds } } },
    });
    const delParts = await tx.serviceJobPart.deleteMany({
      where: { serviceJob: { branchId: { in: unwantedBranchIds } } },
    });
    const delLabour = await tx.serviceLabour.deleteMany({
      where: { serviceJob: { branchId: { in: unwantedBranchIds } } },
    });
    const delDiag = await tx.serviceDiagnosis.deleteMany({
      where: { serviceJob: { branchId: { in: unwantedBranchIds } } },
    });
    const delJobs = await tx.serviceJob.deleteMany({
      where: { branchId: { in: unwantedBranchIds } },
    });
    const delApts = await tx.serviceAppointment.deleteMany({
      where: { branchId: { in: unwantedBranchIds } },
    });

    // B. Delivery, Payments, Invoices, Applications
    const delDeliveries = await tx.delivery.deleteMany({
      where: {
        OR: [
          { booking: { branchId: { in: unwantedBranchIds } } },
          { vehicle: { branchId: { in: unwantedBranchIds } } },
        ],
      },
    });
    const delPayments = await tx.payment.deleteMany({
      where: {
        OR: [
          { booking: { branchId: { in: unwantedBranchIds } } },
          { invoice: { branchId: { in: unwantedBranchIds } } },
        ],
      },
    });
    const delEmi = await tx.financeEmiSchedule.deleteMany({
      where: { financeApplication: { booking: { branchId: { in: unwantedBranchIds } } } },
    });
    const delFinance = await tx.financeApplication.deleteMany({
      where: {
        OR: [
          { booking: { branchId: { in: unwantedBranchIds } } },
          { vehicle: { branchId: { in: unwantedBranchIds } } },
        ],
      },
    });
    const delInsurance = await tx.insurancePolicy.deleteMany({
      where: {
        OR: [
          { booking: { branchId: { in: unwantedBranchIds } } },
          { vehicle: { branchId: { in: unwantedBranchIds } } },
        ],
      },
    });
    const delInvItems = await tx.invoiceItem.deleteMany({
      where: { invoice: { branchId: { in: unwantedBranchIds } } },
    });
    const delInvoices = await tx.invoice.deleteMany({
      where: {
        OR: [
          { branchId: { in: unwantedBranchIds } },
          { franchiseId: { in: unwantedFranchiseIds } },
        ],
      },
    });

    // C. Vehicle Allocations, PDI, Bookings, Quotations, Leads
    const delAllocations = await tx.vehicleAllocation.deleteMany({
      where: {
        OR: [
          { booking: { branchId: { in: unwantedBranchIds } } },
          { vehicle: { branchId: { in: unwantedBranchIds } } },
        ],
      },
    });
    const delPdi = await tx.pdiInspection.deleteMany({
      where: { vehicle: { branchId: { in: unwantedBranchIds } } },
    });
    const delBookings = await tx.booking.deleteMany({
      where: { branchId: { in: unwantedBranchIds } },
    });
    const delQuoteItems = await tx.quotationItem.deleteMany({
      where: { quotation: { branchId: { in: unwantedBranchIds } } },
    });
    const delQuotes = await tx.quotation.deleteMany({
      where: {
        OR: [
          { branchId: { in: unwantedBranchIds } },
          { franchiseId: { in: unwantedFranchiseIds } },
        ],
      },
    });
    const delFollowUps = await tx.followUp.deleteMany({
      where: { lead: { branchId: { in: unwantedBranchIds } } },
    });
    const delLeadActivities = await tx.leadActivity.deleteMany({
      where: { lead: { branchId: { in: unwantedBranchIds } } },
    });
    const delLeads = await tx.lead.deleteMany({
      where: {
        OR: [
          { branchId: { in: unwantedBranchIds } },
          { franchiseId: { in: unwantedFranchiseIds } },
        ],
      },
    });

    // D. Campaigns, Announcements, Reminders, Part Stocks, Vehicles
    const delCampExp = await tx.campaignExpense.deleteMany({
      where: { campaign: { branchId: { in: unwantedBranchIds } } },
    });
    const delCampMem = await tx.campaignMember.deleteMany({
      where: { campaign: { branchId: { in: unwantedBranchIds } } },
    });
    const delCampaigns = await tx.campaign.deleteMany({
      where: {
        OR: [
          { branchId: { in: unwantedBranchIds } },
          { franchiseId: { in: unwantedFranchiseIds } },
        ],
      },
    });
    const delAnnRead = await tx.announcementRead.deleteMany({
      where: { announcement: { branchId: { in: unwantedBranchIds } } },
    });
    const delAnn = await tx.announcement.deleteMany({
      where: {
        OR: [
          { branchId: { in: unwantedBranchIds } },
          { franchiseId: { in: unwantedFranchiseIds } },
        ],
      },
    });
    const delReminders = await tx.customerReminder.deleteMany({
      where: { branchId: { in: unwantedBranchIds } },
    });
    const delCompliance = await tx.vehicleComplianceDocument.deleteMany({
      where: { vehicle: { branchId: { in: unwantedBranchIds } } },
    });
    const delMovements = await tx.partStockMovement.deleteMany({
      where: { partStock: { branchId: { in: unwantedBranchIds } } },
    });
    const delPartStocks = await tx.partStock.deleteMany({
      where: { branchId: { in: unwantedBranchIds } },
    });
    const delVehicles = await tx.vehicle.deleteMany({
      where: { branchId: { in: unwantedBranchIds } },
    });

    // E. Conversations & Chat
    const delChat = await tx.chatMessage.deleteMany({
      where: { conversation: { branchId: { in: unwantedBranchIds } } },
    });
    const delConversations = await tx.conversation.deleteMany({
      where: { branchId: { in: unwantedBranchIds } },
    });

    // F. Employee roles, requests, and non-target employees
    await tx.employeeRoleAssignment.deleteMany({
      where: {
        employee: {
          OR: [
            { branchId: { in: unwantedBranchIds } },
            { userId: { in: testUserIds } },
          ],
        },
      },
    });
    await tx.employeeApprovalRequest.deleteMany({
      where: {
        OR: [
          { employee: { branchId: { in: unwantedBranchIds } } },
          { employee: { userId: { in: testUserIds } } },
          { requestedByUserId: { in: testUserIds } },
          { approvedByUserId: { in: testUserIds } },
        ],
      },
    });
    const delEmployees = await tx.employee.deleteMany({
      where: {
        OR: [
          { branchId: { in: unwantedBranchIds } },
          { userId: { in: testUserIds } },
        ],
      },
    });

    // G. Customer records of test users and CustomerFranchise links
    await tx.customerFranchise.deleteMany({
      where: {
        OR: [
          { franchiseId: { in: unwantedFranchiseIds } },
          { customer: { userId: { in: testUserIds } } },
        ],
      },
    });
    const delCustomers = await tx.customer.deleteMany({
      where: {
        OR: [
          { userId: { in: testUserIds } },
          { preferredBranchId: { in: unwantedBranchIds } },
          {
            email: {
              in: [
                'fleet@logistics.com',
                'service@vanguard.com',
              ],
            },
          },
          { email: { contains: '17930' } },
        ],
        NOT: {
          email: { in: PRESERVED_USER_EMAILS },
        },
      },
    });

    // H. Audit logs and test users
    await tx.auditLog.deleteMany({
      where: { actorUserId: { in: testUserIds } },
    });
    const delUsers = await tx.user.deleteMany({
      where: { id: { in: testUserIds } },
    });

    // I. Delete unwanted branches and franchises
    const delBranches = await tx.branch.deleteMany({
      where: { id: { in: unwantedBranchIds } },
    });
    const delFranchises = await tx.franchise.deleteMany({
      where: { id: { in: unwantedFranchiseIds } },
    });

    console.log(`  - Deleted ${delBranches.count} branches`);
    console.log(`  - Deleted ${delFranchises.count} franchises`);
    console.log(`  - Deleted ${delEmployees.count} test employees`);
    console.log(`  - Deleted ${delCustomers.count} test customers`);
    console.log(`  - Deleted ${delUsers.count} test users`);
    console.log(`  - Deleted ${delVehicles.count} test vehicles`);
    console.log(`  - Deleted ${delBookings.count} test bookings`);
    console.log(`  - Deleted ${delInvoices.count} test invoices`);
    console.log(`  - Deleted ${delQuotes.count} test quotations`);
  });

  console.log('✅ Atomic transaction committed successfully.');

  // 6. Post-cleanup validation
  const remainingFranchises = await prisma.franchise.findMany({
    include: { branches: true },
  });

  console.log('\n================================================================');
  console.log(`FINAL FRANCHISE COUNT: ${remainingFranchises.length}`);
  remainingFranchises.forEach(f => {
    console.log(`Franchise: "${f.name}" (${f.code})`);
    f.branches.forEach(b => {
      console.log(`   Branch: "${b.name}" (${b.code}, ${b.city}, ${b.state})`);
    });
  });

  if (
    remainingFranchises.length === 2 &&
    remainingFranchises.some(f => f.code === 'FR-TATA-01' && f.branches.some(b => b.code === 'BR-UDR-01')) &&
    remainingFranchises.some(f => f.code === 'FR-AL-01' && f.branches.some(b => b.code === 'BR-JAI-01'))
  ) {
    console.log('\n🎉 SUCCESS: Database perfectly matches intended clean dataset!');
  } else {
    throw new Error('Verification failed: Final dataset does not match intended state.');
  }
}

main()
  .catch((err) => {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
