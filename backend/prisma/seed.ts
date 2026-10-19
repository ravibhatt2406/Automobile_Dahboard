import { PrismaClient, VehicleStatus, AccountType, EmployeeStatus, ApprovalStatus, CustomerType, CustomerStatus, LeadStatus, LeadPriority, QuotationStatus, BookingStatus, PaymentStatus, InvoiceStatus, AppointmentStatus, ServiceJobStatus, ConversationStatus, MessageSenderType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Titan Auto Controlled Dataset Reset & Seed Workflow...');

  // 1. SAFE PURGE OF CONFIRMED TEST ARTIFACTS IN DEPENDENT ORDER
  // ==========================================
  console.log('🧹 Safely purging obsolete test run artifacts in dependency order...');

  const targetBranchCodes = ['BR-JAI-01', 'BR-JAI-02', 'BR-UDR-01', 'BR-UDR-02', 'BR-JDH-01', 'BR-JDH-02'];
  const targetFranchiseCodes = ['FR-RAJ-01', 'FR-MEW-02', 'FR-MAR-03'];

  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: '1791126' } },
        { email: { contains: '1791127' } },
        { email: { startsWith: 'inactive-test-' } },
        { email: { startsWith: 'suspended-test-' } },
        { email: { startsWith: 'admin-test-' } },
        { email: { startsWith: 'bm-test-' } },
        { email: { startsWith: 'mech-test-' } },
        { email: { startsWith: 'customer-test-' } },
        { email: { startsWith: 'p2admin-' } },
        { email: { startsWith: 'p3admin-' } },
        { email: { startsWith: 'sa-appr-' } },
        { email: { startsWith: 'cust-appr-' } },
        { email: { startsWith: 'new-emp-' } },
        { email: { startsWith: 'new-mechanic-' } },
        { email: { startsWith: 'bm1-' } },
        { email: { startsWith: 'bm2-' } },
        { email: { startsWith: 'mechanic-1' } },
        { email: 'fleet@logistics.com' },
        { email: 'service@vanguard.com' },
      ],
      NOT: {
        email: { in: ['admin@titanauto.com', 'ravibhatt2406@gmail.com'] },
      },
    },
    select: { id: true, email: true },
  });
  const testUserIds = testUsers.map((u) => u.id);

  // A. Delete service operations test artifacts
  await prisma.serviceQc.deleteMany({
    where: { serviceJob: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.serviceApproval.deleteMany({
    where: { serviceJob: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.serviceJobPart.deleteMany({
    where: { serviceJob: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.serviceLabour.deleteMany({
    where: { serviceJob: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.serviceDiagnosis.deleteMany({
    where: { serviceJob: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.serviceJob.deleteMany({
    where: { branch: { code: { notIn: targetBranchCodes } } },
  });
  await prisma.serviceAppointment.deleteMany({
    where: { branch: { code: { notIn: targetBranchCodes } } },
  });

  // B. Delete deliveries, payments, invoices, applications, inspections
  await prisma.delivery.deleteMany({
    where: { booking: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.payment.deleteMany({
    where: {
      OR: [
        { booking: { branch: { code: { notIn: targetBranchCodes } } } },
        { invoice: { branch: { code: { notIn: targetBranchCodes } } } },
      ],
    },
  });
  await prisma.invoiceItem.deleteMany({
    where: { invoice: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.invoice.deleteMany({
    where: { branch: { code: { notIn: targetBranchCodes } } },
  });
  await prisma.financeApplication.deleteMany({
    where: { booking: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.insurancePolicy.deleteMany({
    where: { booking: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.vehicleAllocation.deleteMany({
    where: { booking: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.pdiInspection.deleteMany({
    where: { vehicle: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.booking.deleteMany({
    where: { branch: { code: { notIn: targetBranchCodes } } },
  });
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({
    where: { branch: { code: { notIn: targetBranchCodes } } },
  });
  await prisma.lead.deleteMany({
    where: { branch: { code: { notIn: targetBranchCodes } } },
  });

  // C. Delete chat messages and conversations
  await prisma.chatMessage.deleteMany({
    where: { conversation: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.conversation.deleteMany({
    where: { branch: { code: { notIn: targetBranchCodes } } },
  });

  // D. Delete non-target branch vehicles and stock
  await prisma.vehicle.deleteMany({
    where: { branch: { code: { notIn: targetBranchCodes } } },
  });
  await prisma.partStockMovement.deleteMany({
    where: { partStock: { branch: { code: { notIn: targetBranchCodes } } } },
  });
  await prisma.partStock.deleteMany({
    where: { branch: { code: { notIn: targetBranchCodes } } },
  });

  // E. Delete employee roles and approval requests (preserving Ravi Bhatt)
  await prisma.employeeRoleAssignment.deleteMany({
    where: {
      OR: [
        { employee: { branch: { code: { notIn: targetBranchCodes } } } },
        { employee: { userId: { in: testUserIds } } },
      ],
      NOT: { employee: { user: { email: 'ravibhatt2406@gmail.com' } } },
    },
  });
  await prisma.employeeApprovalRequest.deleteMany({
    where: {
      OR: [
        { employee: { branch: { code: { notIn: targetBranchCodes } } } },
        { requestedByUserId: { in: testUserIds } },
        { approvedByUserId: { in: testUserIds } },
      ],
      NOT: { employee: { user: { email: 'ravibhatt2406@gmail.com' } } },
    },
  });
  await prisma.employee.deleteMany({
    where: {
      OR: [
        { branch: { code: { notIn: targetBranchCodes } } },
        { userId: { in: testUserIds } },
      ],
      NOT: { user: { email: { in: ['admin@titanauto.com', 'ravibhatt2406@gmail.com'] } } },
    },
  });

  // F. Delete test customer links and test customers
  await prisma.customerFranchise.deleteMany({
    where: { franchise: { code: { notIn: targetFranchiseCodes } } },
  });
  await prisma.customer.deleteMany({
    where: {
      OR: [
        { email: { in: ['fleet@logistics.com', 'service@vanguard.com'] } },
        { userId: { in: testUserIds } },
      ],
    },
  });

  // G. Delete test users and audit logs
  await prisma.auditLog.deleteMany({
    where: { actorUserId: { in: testUserIds } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: testUserIds } },
  });

  // Migrate legacy seed franchise code FR-AL-01 to target FR-RAJ-01
  await prisma.franchise.updateMany({
    where: { code: 'FR-AL-01' },
    data: {
      code: 'FR-RAJ-01',
      name: 'Titan Commercial Motors (Rajasthan)',
      legalName: 'Titan Rajasthan Commercial Fleet Dealerships Pvt Ltd',
      taxId: 'GSTIN08TITAN01',
    },
  });

  // H. Delete non-target branches and franchises
  await prisma.branch.deleteMany({
    where: { code: { notIn: targetBranchCodes } },
  });
  await prisma.franchise.deleteMany({
    where: { code: { notIn: targetFranchiseCodes } },
  });

  console.log('✅ Safe dependency-ordered purge completed.');

  // ==========================================
  // 2. SEED SYSTEM ROLES
  // ==========================================
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Global Platform Super Admin', rank: 1 },
    { name: 'FRANCHISE_OWNER', description: 'Franchise Owner Executive', rank: 2 },
    { name: 'FRANCHISE_MANAGER', description: 'Franchise Regional Manager', rank: 3 },
    { name: 'BRANCH_OWNER', description: 'Branch Dealership Owner', rank: 4 },
    { name: 'BRANCH_MANAGER', description: 'Branch Dealership Manager', rank: 5 },
    { name: 'DEPARTMENT_MANAGER', description: 'Department Manager', rank: 6 },
    { name: 'SALES_EMPLOYEE', description: 'Commercial Sales Executive', rank: 7 },
    { name: 'SERVICE_ADVISOR', description: 'Service Advisor', rank: 8 },
    { name: 'MECHANIC', description: 'Certified Service Technician', rank: 9 },
    { name: 'EMPLOYEE', description: 'General Operational Staff', rank: 10 },
    { name: 'CUSTOMER', description: 'Fleet Customer Account', rank: 99 },
  ];

  const roleMap: Record<string, string> = {};
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { rank: roleData.rank, description: roleData.description },
      create: {
        name: roleData.name,
        description: roleData.description,
        rank: roleData.rank,
        isSystem: true,
      },
    });
    roleMap[roleData.name] = role.id;
  }
  console.log(`✅ System roles verified: ${roles.length}`);

  // ==========================================
  // 3. SEED GRANULAR PERMISSIONS
  // ==========================================
  const permissions = [
    { name: 'franchise.create', module: 'franchise', description: 'Create new franchises' },
    { name: 'franchise.read', module: 'franchise', description: 'View franchise details' },
    { name: 'franchise.update', module: 'franchise', description: 'Update franchise configuration' },
    { name: 'branch.create', module: 'branch', description: 'Create new branch hubs' },
    { name: 'branch.read', module: 'branch', description: 'View branch details' },
    { name: 'branch.update', module: 'branch', description: 'Update branch configuration' },
    { name: 'employee.create', module: 'employee', description: 'Create employee accounts' },
    { name: 'employee.read', module: 'employee', description: 'View employee profiles' },
    { name: 'employee.update', module: 'employee', description: 'Update employee records' },
    { name: 'employee.approve', module: 'employee', description: 'Approve onboarding requests' },
    { name: 'employee.deactivate', module: 'employee', description: 'Deactivate employee accounts' },
    { name: 'customer.create', module: 'customer', description: 'Create customer profiles' },
    { name: 'customer.read', module: 'customer', description: 'View customer records' },
    { name: 'customer.update', module: 'customer', description: 'Update customer records' },
    { name: 'inventory.create', module: 'inventory', description: 'Add inventory vehicles' },
    { name: 'inventory.read', module: 'inventory', description: 'View vehicle inventory' },
    { name: 'inventory.update', module: 'inventory', description: 'Update vehicle inventory' },
    { name: 'sales.create', module: 'sales', description: 'Create quotations & bookings' },
    { name: 'sales.read', module: 'sales', description: 'View sales data' },
    { name: 'sales.update', module: 'sales', description: 'Update sales records' },
    { name: 'service.create', module: 'service', description: 'Create service appointments and jobs' },
    { name: 'service.read', module: 'service', description: 'View service jobs' },
    { name: 'service.update', module: 'service', description: 'Update service jobs' },
    { name: 'reports.read', module: 'reports', description: 'View analytics reports' },
    { name: 'audit.read', module: 'audit', description: 'View system audit trail' },
  ];

  const permMap: Record<string, string> = {};
  for (const permData of permissions) {
    const perm = await prisma.permission.upsert({
      where: { name: permData.name },
      update: { description: permData.description, module: permData.module },
      create: {
        name: permData.name,
        description: permData.description,
        module: permData.module,
      },
    });
    permMap[permData.name] = perm.id;
  }

  const rolePermissionAssignments: Array<{ roleName: string; perms: string[] }> = [
    { roleName: 'SUPER_ADMIN', perms: Object.keys(permMap) },
    {
      roleName: 'FRANCHISE_OWNER',
      perms: [
        'franchise.read', 'branch.create', 'branch.read', 'branch.update',
        'employee.create', 'employee.read', 'employee.update', 'employee.approve', 'employee.deactivate',
        'customer.create', 'customer.read', 'customer.update',
        'inventory.create', 'inventory.read', 'inventory.update',
        'sales.create', 'sales.read', 'sales.update',
        'service.read', 'reports.read',
      ],
    },
    {
      roleName: 'BRANCH_MANAGER',
      perms: [
        'branch.read',
        'employee.create', 'employee.read', 'employee.approve', 'employee.deactivate',
        'customer.create', 'customer.read', 'customer.update',
        'inventory.create', 'inventory.read', 'inventory.update',
        'sales.create', 'sales.read', 'sales.update',
        'service.create', 'service.read', 'service.update',
        'reports.read',
      ],
    },
    {
      roleName: 'SALES_EMPLOYEE',
      perms: [
        'customer.create', 'customer.read', 'customer.update',
        'inventory.read', 'sales.create', 'sales.read', 'sales.update',
      ],
    },
    {
      roleName: 'SERVICE_ADVISOR',
      perms: [
        'customer.read', 'inventory.read', 'service.create', 'service.read', 'service.update',
      ],
    },
    {
      roleName: 'MECHANIC',
      perms: ['inventory.read', 'service.read', 'service.update'],
    },
    {
      roleName: 'EMPLOYEE',
      perms: ['branch.read', 'inventory.read', 'customer.read'],
    },
    {
      roleName: 'CUSTOMER',
      perms: ['customer.read', 'inventory.read', 'sales.read', 'service.read'],
    },
  ];

  for (const assignment of rolePermissionAssignments) {
    const roleId = roleMap[assignment.roleName];
    if (!roleId) continue;
    for (const permName of assignment.perms) {
      const permissionId = permMap[permName];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  // ==========================================
  // 4. SEED MANUFACTURER, MODELS & VARIANTS
  // ==========================================
  const ashokManufacturer = await prisma.manufacturer.upsert({
    where: { name: 'Ashok Leyland' },
    update: { country: 'India', status: 'ACTIVE' },
    create: { name: 'Ashok Leyland', country: 'India', status: 'ACTIVE' },
  });

  const modelAvtr = await prisma.truckModel.upsert({
    where: { id: 'model-al-avtr-5525' },
    update: { name: 'AVTR 5525.T', category: 'Heavy Commercial Vehicle' },
    create: {
      id: 'model-al-avtr-5525',
      manufacturerId: ashokManufacturer.id,
      name: 'AVTR 5525.T',
      category: 'Heavy Commercial Vehicle',
      status: 'ACTIVE',
    },
  });

  const variantAvtr = await prisma.truckVariant.upsert({
    where: { id: 'var-al-avtr-5525-cowl' },
    update: { name: 'AVTR 5525.T 4x2 Cowl & Chassis', basePrice: 3850000 },
    create: {
      id: 'var-al-avtr-5525-cowl',
      modelId: modelAvtr.id,
      name: 'AVTR 5525.T 4x2 Cowl & Chassis',
      engineDetails: 'A Series 4 Cylinder with i-Gen6 Technology',
      horsepower: 250,
      fuelType: 'DIESEL',
      transmission: '9-Speed Synchromesh',
      payload: 40000,
      basePrice: 3850000,
      gstRate: 28.0,
      description: 'Heavy duty modular haulage truck for long distance interstate transport.',
    },
  });

  const modelEcomet = await prisma.truckModel.upsert({
    where: { id: 'model-al-ecomet-1215' },
    update: { name: 'Ecomet 1215 HE', category: 'Intermediate Commercial Vehicle' },
    create: {
      id: 'model-al-ecomet-1215',
      manufacturerId: ashokManufacturer.id,
      name: 'Ecomet 1215 HE',
      category: 'Intermediate Commercial Vehicle',
      status: 'ACTIVE',
    },
  });

  const variantEcomet = await prisma.truckVariant.upsert({
    where: { id: 'var-al-ecomet-1215-cargo' },
    update: { name: 'Ecomet 1215 HE 17ft Cabin Cargo', basePrice: 2150000 },
    create: {
      id: 'var-al-ecomet-1215-cargo',
      modelId: modelEcomet.id,
      name: 'Ecomet 1215 HE 17ft Cabin Cargo',
      engineDetails: 'H series 4 Cylinder CRS with i-Gen6',
      horsepower: 150,
      fuelType: 'DIESEL',
      transmission: '6-Speed Manual',
      payload: 7800,
      basePrice: 2150000,
      gstRate: 28.0,
      description: 'Reliable and fuel-efficient ICV for regional distribution.',
    },
  });

  const modelBadaDost = await prisma.truckModel.upsert({
    where: { id: 'model-al-bada-dost' },
    update: { name: 'Bada Dost', category: 'Light Commercial Vehicle' },
    create: {
      id: 'model-al-bada-dost',
      manufacturerId: ashokManufacturer.id,
      name: 'Bada Dost',
      category: 'Light Commercial Vehicle',
      status: 'ACTIVE',
    },
  });

  const variantBadaDost = await prisma.truckVariant.upsert({
    where: { id: 'var-al-bada-dost-i4' },
    update: { name: 'Bada Dost i4 High Deck', basePrice: 875000 },
    create: {
      id: 'var-al-bada-dost-i4',
      modelId: modelBadaDost.id,
      name: 'Bada Dost i4 High Deck',
      engineDetails: '1.5L 3-Cylinder Turbocharged Diesel',
      horsepower: 80,
      fuelType: 'DIESEL',
      transmission: '5-Speed Manual',
      payload: 1825,
      basePrice: 875000,
      gstRate: 28.0,
      description: 'Next-gen customer-centric LCV for intra-city and hub delivery.',
    },
  });

  // ==========================================
  // 5. SEED EXACTLY 3 FRANCHISES
  // ==========================================
  console.log('🏢 Seeding exactly 3 Franchises...');
  const franchiseConfigs = [
    {
      code: 'FR-RAJ-01',
      name: 'Titan Commercial Motors (Rajasthan)',
      legalName: 'Titan Rajasthan Commercial Fleet Dealerships Pvt Ltd',
      taxId: 'GSTIN08TITAN01',
      city: 'Jaipur',
    },
    {
      code: 'FR-MEW-02',
      name: 'Mewar Heavy Trucks & Fleet Network',
      legalName: 'Mewar Commercial Vehicles & Logistics Ltd',
      taxId: 'GSTIN08MEWAR02',
      city: 'Udaipur',
    },
    {
      code: 'FR-MAR-03',
      name: 'Marwar Commercial Logistics Franchise',
      legalName: 'Marwar Heavy Haulage Dealerships Ltd',
      taxId: 'GSTIN08MARWAR03',
      city: 'Jodhpur',
    },
  ];

  const franchiseMap: Record<string, string> = {};
  for (const fc of franchiseConfigs) {
    const f = await prisma.franchise.upsert({
      where: { code: fc.code },
      update: { name: fc.name, legalName: fc.legalName, taxId: fc.taxId, status: 'ACTIVE' },
      create: { code: fc.code, name: fc.name, legalName: fc.legalName, taxId: fc.taxId, status: 'ACTIVE' },
    });
    franchiseMap[fc.code] = f.id;
  }

  // ==========================================
  // 6. SEED EXACTLY 6 BRANCHES (2 PER CITY)
  // ==========================================
  console.log('📍 Seeding exactly 6 Branches (2 in Udaipur, 2 in Jaipur, 2 in Jodhpur)...');
  const branchConfigs = [
    // Jaipur Branches -> FR-RAJ-01
    {
      code: 'BR-JAI-01',
      name: 'Jaipur Central',
      city: 'Jaipur',
      state: 'Rajasthan',
      address: 'Plot 42, Sitapura Industrial Area, Tonk Road',
      franchiseCode: 'FR-RAJ-01',
    },
    {
      code: 'BR-JAI-02',
      name: 'Jaipur Industrial',
      city: 'Jaipur',
      state: 'Rajasthan',
      address: 'Road No. 9, Vishwakarma Industrial Area (VKIA)',
      franchiseCode: 'FR-RAJ-01',
    },
    // Udaipur Branches -> FR-MEW-02
    {
      code: 'BR-UDR-01',
      name: 'Udaipur Central',
      city: 'Udaipur',
      state: 'Rajasthan',
      address: 'Plot 105, Mewar Industrial Complex, Madri Industrial Area',
      franchiseCode: 'FR-MEW-02',
    },
    {
      code: 'BR-UDR-02',
      name: 'Udaipur Industrial',
      city: 'Udaipur',
      state: 'Rajasthan',
      address: 'NH-8 Highway Hub, Sukher Industrial Zone',
      franchiseCode: 'FR-MEW-02',
    },
    // Jodhpur Branches -> FR-MAR-03
    {
      code: 'BR-JDH-01',
      name: 'Jodhpur Central',
      city: 'Jodhpur',
      state: 'Rajasthan',
      address: 'Plot 28, Industrial Estate Phase 2, Basni',
      franchiseCode: 'FR-MAR-03',
    },
    {
      code: 'BR-JDH-02',
      name: 'Jodhpur Industrial',
      city: 'Jodhpur',
      state: 'Rajasthan',
      address: 'Sector 5, Boranada Special Economic Zone (SEZ)',
      franchiseCode: 'FR-MAR-03',
    },
  ];

  const branchMap: Record<string, string> = {};
  for (const bc of branchConfigs) {
    const b = await prisma.branch.upsert({
      where: { code: bc.code },
      update: {
        name: bc.name,
        city: bc.city,
        state: bc.state,
        address: bc.address,
        franchiseId: franchiseMap[bc.franchiseCode],
        status: 'ACTIVE',
      },
      create: {
        code: bc.code,
        name: bc.name,
        city: bc.city,
        state: bc.state,
        address: bc.address,
        franchiseId: franchiseMap[bc.franchiseCode],
        status: 'ACTIVE',
      },
    });
    branchMap[bc.code] = b.id;
  }

  // ==========================================
  // 7. PREPARE COMMON PASSWORDS FOR SEED USERS
  // ==========================================
  const defaultPasswordHash = await bcrypt.hash('Admin123!', 10);
  const managerPasswordHash = await bcrypt.hash('Manager123!', 10);
  const salesPasswordHash = await bcrypt.hash('Sales123!', 10);
  const advisorPasswordHash = await bcrypt.hash('Advisor123!', 10);
  const mechanicPasswordHash = await bcrypt.hash('Mechanic123!', 10);
  const staffPasswordHash = await bcrypt.hash('Staff123!', 10);
  const customerPasswordHash = await bcrypt.hash('Customer123!', 10);

  // A. Super Admin (Global Platform User)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@titanauto.com' },
    update: { passwordHash: defaultPasswordHash, status: 'ACTIVE', accountType: AccountType.SUPER_ADMIN },
    create: {
      email: 'admin@titanauto.com',
      passwordHash: defaultPasswordHash,
      accountType: AccountType.SUPER_ADMIN,
      status: 'ACTIVE',
    },
  });

  const adminEmp = await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: { status: EmployeeStatus.ACTIVE, branchId: branchMap['BR-JAI-01'] },
    create: {
      userId: adminUser.id,
      branchId: branchMap['BR-JAI-01'],
      employeeCode: 'EMP-ADM-001',
      firstName: 'Alexander',
      lastName: 'Vance',
      designation: 'Global Platform Admin',
      status: EmployeeStatus.ACTIVE,
    },
  });

  await prisma.employeeRoleAssignment.upsert({
    where: { employeeId_roleId: { employeeId: adminEmp.id, roleId: roleMap['SUPER_ADMIN'] } },
    update: {},
    create: { employeeId: adminEmp.id, roleId: roleMap['SUPER_ADMIN'] },
  });

  // B. Franchise Owners (3 executives, 1 per franchise)
  const franchiseOwners = [
    { email: 'owner.rajasthan@titanauto.com', name: 'Vikramaditya', code: 'EMP-FO-01', franchiseCode: 'FR-RAJ-01', branchCode: 'BR-JAI-01' },
    { email: 'owner.mewar@titanauto.com', name: 'Bhim Singh', code: 'EMP-FO-02', franchiseCode: 'FR-MEW-02', branchCode: 'BR-UDR-01' },
    { email: 'owner.marwar@titanauto.com', name: 'Gaj Singh', code: 'EMP-FO-03', franchiseCode: 'FR-MAR-03', branchCode: 'BR-JDH-01' },
  ];

  for (const fo of franchiseOwners) {
    const foUser = await prisma.user.upsert({
      where: { email: fo.email },
      update: { passwordHash: defaultPasswordHash, status: 'ACTIVE', accountType: AccountType.EMPLOYEE },
      create: { email: fo.email, passwordHash: defaultPasswordHash, accountType: AccountType.EMPLOYEE, status: 'ACTIVE' },
    });
    const foEmp = await prisma.employee.upsert({
      where: { userId: foUser.id },
      update: { status: EmployeeStatus.ACTIVE, branchId: branchMap[fo.branchCode] },
      create: {
        userId: foUser.id,
        branchId: branchMap[fo.branchCode],
        employeeCode: fo.code,
        firstName: fo.name,
        lastName: 'Rathore',
        designation: 'Franchise Owner Executive',
        status: EmployeeStatus.ACTIVE,
      },
    });
    await prisma.employeeRoleAssignment.upsert({
      where: { employeeId_roleId: { employeeId: foEmp.id, roleId: roleMap['FRANCHISE_OWNER'] } },
      update: {},
      create: { employeeId: foEmp.id, roleId: roleMap['FRANCHISE_OWNER'] },
    });
  }

  // =========================================================================
  // 8. SEED EXACTLY 30 BRANCH EMPLOYEES (EXACTLY 5 PER EACH OF THE 6 BRANCHES)
  // =========================================================================
  console.log('👥 Seeding exactly 30 branch employees (5 per branch)...');

  const branchEmployeeDefinitions = [
    // --- 1. Jaipur Central (BR-JAI-01) ---
    {
      branchCode: 'BR-JAI-01',
      employees: [
        { email: 'manager.jaipur@titanauto.com', role: 'BRANCH_MANAGER', code: 'EMP-JAI-MGR01', first: 'Rajesh', last: 'Sharma', desig: 'Branch General Manager', pwd: managerPasswordHash },
        { email: 'sales.jaipur@titanauto.com', role: 'SALES_EMPLOYEE', code: 'EMP-JAI-SALES01', first: 'Amit', last: 'Verma', desig: 'Commercial Sales Executive', pwd: salesPasswordHash },
        { email: 'advisor.jaipur@titanauto.com', role: 'SERVICE_ADVISOR', code: 'EMP-JAI-ADV01', first: 'Sunita', last: 'Meena', desig: 'Commercial Service Advisor', pwd: advisorPasswordHash },
        { email: 'mechanic.jaipur@titanauto.com', role: 'MECHANIC', code: 'EMP-JAI-TECH01', first: 'Rahul', last: 'Saini', desig: 'Senior Commercial Vehicle Technician', pwd: mechanicPasswordHash },
        { email: 'staff.jaipur@titanauto.com', role: 'EMPLOYEE', code: 'EMP-JAI-OPS01', first: 'Deepak', last: 'Rathore', desig: 'Branch Logistics & Parts Assistant', pwd: staffPasswordHash },
      ],
    },
    // --- 2. Jaipur Industrial (BR-JAI-02) ---
    {
      branchCode: 'BR-JAI-02',
      employees: [
        { email: 'mgr.jai.ind@titanauto.com', role: 'BRANCH_MANAGER', code: 'EMP-JAI-IND-MGR', first: 'Vikram', last: 'Joshi', desig: 'Industrial Branch Manager', pwd: managerPasswordHash },
        { email: 'sales.jai.ind@titanauto.com', role: 'SALES_EMPLOYEE', code: 'EMP-JAI-IND-SALES', first: 'Priyanka', last: 'Kalla', desig: 'Commercial Sales Executive', pwd: salesPasswordHash },
        { email: 'advisor.jai.ind@titanauto.com', role: 'SERVICE_ADVISOR', code: 'EMP-JAI-IND-ADV', first: 'Manoj', last: 'Choudhary', desig: 'Heavy Commercial Service Advisor', pwd: advisorPasswordHash },
        { email: 'mech.jai.ind@titanauto.com', role: 'MECHANIC', code: 'EMP-JAI-IND-TECH', first: 'Kishan', last: 'Lal', desig: 'Master Heavy Vehicle Mechanic', pwd: mechanicPasswordHash },
        { email: 'staff.jai.ind@titanauto.com', role: 'EMPLOYEE', code: 'EMP-JAI-IND-OPS', first: 'Ankit', last: 'Sharma', desig: 'PDI & Yard Logistics Assistant', pwd: staffPasswordHash },
      ],
    },
    // --- 3. Udaipur Central (BR-UDR-01) ---
    // Note: Ravi Bhatt (genuine user ravibhatt2406@gmail.com) is preserved as the 5th employee
    {
      branchCode: 'BR-UDR-01',
      employees: [
        { email: 'mgr.udr.cen@titanauto.com', role: 'BRANCH_MANAGER', code: 'EMP-UDR-CEN-MGR', first: 'Surendra', last: 'Sisodia', desig: 'Branch General Manager', pwd: managerPasswordHash },
        { email: 'sales.udr.cen@titanauto.com', role: 'SALES_EMPLOYEE', code: 'EMP-UDR-CEN-SALES', first: 'Neha', last: 'Paliwal', desig: 'Commercial Sales Executive', pwd: salesPasswordHash },
        { email: 'advisor.udr.cen@titanauto.com', role: 'SERVICE_ADVISOR', code: 'EMP-UDR-CEN-ADV', first: 'Bhupendra', last: 'Rawat', desig: 'Commercial Fleet Service Advisor', pwd: advisorPasswordHash },
        { email: 'mech.udr.cen@titanauto.com', role: 'MECHANIC', code: 'EMP-UDR-CEN-TECH', first: 'Mohan', last: 'Lohar', desig: 'Certified Commercial Technician', pwd: mechanicPasswordHash },
        { email: 'ravibhatt2406@gmail.com', role: 'EMPLOYEE', code: 'EMP-8673', first: 'Ravi', last: 'Bhatt', desig: 'Branch Operations Officer', pwd: defaultPasswordHash },
      ],
    },
    // --- 4. Udaipur Industrial (BR-UDR-02) ---
    {
      branchCode: 'BR-UDR-02',
      employees: [
        { email: 'mgr.udr.ind@titanauto.com', role: 'BRANCH_MANAGER', code: 'EMP-UDR-IND-MGR', first: 'Gajendra', last: 'Menaria', desig: 'Industrial Branch Manager', pwd: managerPasswordHash },
        { email: 'sales.udr.ind@titanauto.com', role: 'SALES_EMPLOYEE', code: 'EMP-UDR-IND-SALES', first: 'Tarun', last: 'Dangi', desig: 'Commercial Sales Executive', pwd: salesPasswordHash },
        { email: 'advisor.udr.ind@titanauto.com', role: 'SERVICE_ADVISOR', code: 'EMP-UDR-IND-ADV', first: 'Laxman', last: 'Sen', desig: 'Commercial Fleet Service Advisor', pwd: advisorPasswordHash },
        { email: 'mech.udr.ind@titanauto.com', role: 'MECHANIC', code: 'EMP-UDR-IND-TECH', first: 'Prakash', last: 'Meghwal', desig: 'Senior Commercial Technician', pwd: mechanicPasswordHash },
        { email: 'staff.udr.ind@titanauto.com', role: 'EMPLOYEE', code: 'EMP-UDR-IND-OPS', first: 'Dinesh', last: 'Vaishnav', desig: 'Warehouse & Parts Logistics', pwd: staffPasswordHash },
      ],
    },
    // --- 5. Jodhpur Central (BR-JDH-01) ---
    {
      branchCode: 'BR-JDH-01',
      employees: [
        { email: 'mgr.jdh.cen@titanauto.com', role: 'BRANCH_MANAGER', code: 'EMP-JDH-CEN-MGR', first: 'Jaswant', last: 'Bhati', desig: 'Branch General Manager', pwd: managerPasswordHash },
        { email: 'sales.jdh.cen@titanauto.com', role: 'SALES_EMPLOYEE', code: 'EMP-JDH-CEN-SALES', first: 'Rohit', last: 'Gehlot', desig: 'Commercial Sales Executive', pwd: salesPasswordHash },
        { email: 'advisor.jdh.cen@titanauto.com', role: 'SERVICE_ADVISOR', code: 'EMP-JDH-CEN-ADV', first: 'Mahaveer', last: 'Bishnoi', desig: 'Fleet Service Advisor', pwd: advisorPasswordHash },
        { email: 'mech.jdh.cen@titanauto.com', role: 'MECHANIC', code: 'EMP-JDH-CEN-TECH', first: 'Ram Dayal', last: 'Prajapat', desig: 'Commercial Vehicle Master Technician', pwd: mechanicPasswordHash },
        { email: 'staff.jdh.cen@titanauto.com', role: 'EMPLOYEE', code: 'EMP-JDH-CEN-OPS', first: 'Kailash', last: 'Charan', desig: 'Operations & Yard Assistant', pwd: staffPasswordHash },
      ],
    },
    // --- 6. Jodhpur Industrial (BR-JDH-02) ---
    {
      branchCode: 'BR-JDH-02',
      employees: [
        { email: 'mgr.jdh.ind@titanauto.com', role: 'BRANCH_MANAGER', code: 'EMP-JDH-IND-MGR', first: 'Hanwant', last: 'Rathore', desig: 'Industrial Branch Manager', pwd: managerPasswordHash },
        { email: 'sales.jdh.ind@titanauto.com', role: 'SALES_EMPLOYEE', code: 'EMP-JDH-IND-SALES', first: 'Sunita', last: 'Parihar', desig: 'Commercial Sales Executive', pwd: salesPasswordHash },
        { email: 'advisor.jdh.ind@titanauto.com', role: 'SERVICE_ADVISOR', code: 'EMP-JDH-IND-ADV', first: 'Suresh', last: 'Deora', desig: 'Fleet Service Advisor', pwd: advisorPasswordHash },
        { email: 'mech.jdh.ind@titanauto.com', role: 'MECHANIC', code: 'EMP-JDH-IND-TECH', first: 'Govind', last: 'Mali', desig: 'Commercial Vehicle Technician', pwd: mechanicPasswordHash },
        { email: 'staff.jdh.ind@titanauto.com', role: 'EMPLOYEE', code: 'EMP-JDH-IND-OPS', first: 'Narendra', last: 'Solanki', desig: 'Branch Inventory & Logistics', pwd: staffPasswordHash },
      ],
    },
  ];

  const employeeMap: Record<string, string> = {};
  let totalBranchEmpCount = 0;

  for (const bGroup of branchEmployeeDefinitions) {
    const branchId = branchMap[bGroup.branchCode];
    for (const empData of bGroup.employees) {
      totalBranchEmpCount++;
      const user = await prisma.user.upsert({
        where: { email: empData.email },
        update: {
          accountType: AccountType.EMPLOYEE,
          status: 'ACTIVE',
        },
        create: {
          email: empData.email,
          passwordHash: empData.pwd,
          accountType: AccountType.EMPLOYEE,
          status: 'ACTIVE',
        },
      });

      const employee = await prisma.employee.upsert({
        where: { employeeCode: empData.code },
        update: {
          userId: user.id,
          branchId,
          firstName: empData.first,
          lastName: empData.last,
          designation: empData.desig,
          status: EmployeeStatus.ACTIVE,
        },
        create: {
          userId: user.id,
          branchId,
          employeeCode: empData.code,
          firstName: empData.first,
          lastName: empData.last,
          designation: empData.desig,
          status: EmployeeStatus.ACTIVE,
        },
      });

      employeeMap[empData.code] = employee.id;

      // Assign system role
      const roleId = roleMap[empData.role];
      if (roleId) {
        await prisma.employeeRoleAssignment.upsert({
          where: { employeeId_roleId: { employeeId: employee.id, roleId } },
          update: {},
          create: { employeeId: employee.id, roleId },
        });
      }
    }
  }
  console.log(`✅ Seeded exactly ${totalBranchEmpCount} branch-assigned employees (5 per branch across 6 branches).`);

  // =========================================================================
  // 9. SEED EXACTLY 30 CUSTOMERS (EXACTLY 5 ASSOCIATED PER EACH OF THE 6 BRANCHES)
  // =========================================================================
  console.log('🏢 Seeding exactly 30 customers (5 associated per branch)...');

  const branchCustomerDefinitions = [
    // --- 1. Jaipur Central Customers ---
    {
      branchCode: 'BR-JAI-01',
      customers: [
        { email: 'customer@rajasthanlogistics.com', name: 'Vikram Singh Shekhawat', phone: '+91 98290 12345', company: 'Rajasthan Logistics & Freight Corp', city: 'Jaipur', gstin: '08AABCR1234F1Z1' },
        { email: 'cust.jai1@titanfleet.dev', name: 'Ramesh Chand Goyal', phone: '+91 98290 22001', company: 'PinkCity Heavy Transports Pvt Ltd', city: 'Jaipur', gstin: '08AABCP2201F1Z2' },
        { email: 'cust.jai2@titanfleet.dev', name: 'Mahendra Agarwal', phone: '+91 98290 22002', company: 'Jaipur Super Express Lines Ltd', city: 'Jaipur', gstin: '08AABCJ2202F1Z3' },
        { email: 'cust.jai3@titanfleet.dev', name: 'Sunita Khandelwal', phone: '+91 98290 22003', company: 'Aravalli Cargo Carriers', city: 'Jaipur', gstin: '08AABCA2203F1Z4' },
        { email: 'cust.jai4@titanfleet.dev', name: 'Harish Singhal', phone: '+91 98290 22004', company: 'Shekhawati Freight Movers Pvt Ltd', city: 'Jaipur', gstin: '08AABCS2204F1Z5' },
      ],
    },
    // --- 2. Jaipur Industrial Customers ---
    {
      branchCode: 'BR-JAI-02',
      customers: [
        { email: 'cust.jai5@titanfleet.dev', name: 'Devendra Pareek', phone: '+91 98290 22005', company: 'Sitapura Industrial Freight Ltd', city: 'Jaipur', gstin: '08AABCD2205F1Z6' },
        { email: 'cust.jai6@titanfleet.dev', name: 'Sanjay Godara', phone: '+91 98290 22006', company: 'VKIA Haulage & Container Corp', city: 'Jaipur', gstin: '08AABCG2206F1Z7' },
        { email: 'cust.jai7@titanfleet.dev', name: 'Ashok Bagaria', phone: '+91 98290 22007', company: 'Jaipur Ring Road Cargo Lines', city: 'Jaipur', gstin: '08AABCB2207F1Z8' },
        { email: 'cust.jai8@titanfleet.dev', name: 'Ritu Mathur', phone: '+91 98290 22008', company: 'Apex Highway Freightlines Ltd', city: 'Jaipur', gstin: '08AABCM2208F1Z9' },
        { email: 'cust.jai9@titanfleet.dev', name: 'Bhawani Singh', phone: '+91 98290 22009', company: 'Amber Commercial Logistics', city: 'Jaipur', gstin: '08AABCA2209F1Z0' },
      ],
    },
    // --- 3. Udaipur Central Customers ---
    {
      branchCode: 'BR-UDR-01',
      customers: [
        { email: 'cust.udr1@titanfleet.dev', name: 'Narendra Ranawat', phone: '+91 98290 33001', company: 'LakeCity Marble Logistics Ltd', city: 'Udaipur', gstin: '08AABCL3301F1Z1' },
        { email: 'cust.udr2@titanfleet.dev', name: 'Chetan Paliwal', phone: '+91 98290 33002', company: 'Mewar Heavy Transport Fleet', city: 'Udaipur', gstin: '08AABCM3302F1Z2' },
        { email: 'cust.udr3@titanfleet.dev', name: 'Suman Chouhan', phone: '+91 98290 33003', company: 'Fatehsagar Commercial Cargo Lines', city: 'Udaipur', gstin: '08AABCF3303F1Z3' },
        { email: 'cust.udr4@titanfleet.dev', name: 'Pradeep Shrimali', phone: '+91 98290 33004', company: 'Udaipur Mineral Express Corp', city: 'Udaipur', gstin: '08AABCU3304F1Z4' },
        { email: 'cust.udr5@titanfleet.dev', name: 'Hemant Menaria', phone: '+91 98290 33005', company: 'Girwa Valley Freightlines Ltd', city: 'Udaipur', gstin: '08AABCG3305F1Z5' },
      ],
    },
    // --- 4. Udaipur Industrial Customers ---
    {
      branchCode: 'BR-UDR-02',
      customers: [
        { email: 'cust.udr6@titanfleet.dev', name: 'Jagdish Dangi', phone: '+91 98290 33006', company: 'Sukher Highway Logistics Pvt Ltd', city: 'Udaipur', gstin: '08AABCS3306F1Z6' },
        { email: 'cust.udr7@titanfleet.dev', name: 'Bhupendra Jain', phone: '+91 98290 33007', company: 'Madri Industrial Cargo Lines', city: 'Udaipur', gstin: '08AABCM3307F1Z7' },
        { email: 'cust.udr8@titanfleet.dev', name: 'Vinod Kumawat', phone: '+91 98290 33008', company: 'Debari Smelter Road Haulage', city: 'Udaipur', gstin: '08AABCD3308F1Z8' },
        { email: 'cust.udr9@titanfleet.dev', name: 'Mamta Meena', phone: '+91 98290 33009', company: 'Mewar Bulk Freight Carriers', city: 'Udaipur', gstin: '08AABCM3309F1Z9' },
        { email: 'cust.udr10@titanfleet.dev', name: 'Suresh Patel', phone: '+91 98290 33010', company: 'Rajasthan Zinc Express Transports', city: 'Udaipur', gstin: '08AABCZ3310F1Z0' },
      ],
    },
    // --- 5. Jodhpur Central Customers ---
    {
      branchCode: 'BR-JDH-01',
      customers: [
        { email: 'cust.jdh1@titanfleet.dev', name: 'Om Prakash Bishnoi', phone: '+91 98290 44001', company: 'Marwar Desert Express Freight', city: 'Jodhpur', gstin: '08AABCM4401F1Z1' },
        { email: 'cust.jdh2@titanfleet.dev', name: 'Shaitan Singh Bhati', phone: '+91 98290 44002', company: 'SunCity Commercial Fleet Lines', city: 'Jodhpur', gstin: '08AABCS4402F1Z2' },
        { email: 'cust.jdh3@titanfleet.dev', name: 'Rekha Gehlot', phone: '+91 98290 44003', company: 'Jodhpur Stone & Handicraft Cargo', city: 'Jodhpur', gstin: '08AABCJ4403F1Z3' },
        { email: 'cust.jdh4@titanfleet.dev', name: 'Ganpat Lal Tak', phone: '+91 98290 44004', company: 'Mehrangarh Road Transports Ltd', city: 'Jodhpur', gstin: '08AABCM4404F1Z4' },
        { email: 'cust.jdh5@titanfleet.dev', name: 'Kalu Ram Prajapat', phone: '+91 98290 44005', company: 'Thar Regional Haulage Network', city: 'Jodhpur', gstin: '08AABCT4405F1Z5' },
      ],
    },
    // --- 6. Jodhpur Industrial Customers ---
    {
      branchCode: 'BR-JDH-02',
      customers: [
        { email: 'cust.jdh6@titanfleet.dev', name: 'Bhanwar Lal Choudhary', phone: '+91 98290 44006', company: 'Basni Industrial Fleet Solutions', city: 'Jodhpur', gstin: '08AABCB4406F1Z6' },
        { email: 'cust.jdh7@titanfleet.dev', name: 'Prem Singh Panwar', phone: '+91 98290 44007', company: 'Boranada SEZ Freight Lines Ltd', city: 'Jodhpur', gstin: '08AABCP4407F1Z7' },
        { email: 'cust.jdh8@titanfleet.dev', name: 'Urmila Bika', phone: '+91 98290 44008', company: 'Mandore Commercial Transport Corp', city: 'Jodhpur', gstin: '08AABCM4408F1Z8' },
        { email: 'cust.jdh9@titanfleet.dev', name: 'Mohan Ram Dewasi', phone: '+91 98290 44009', company: 'Salawas Heavy Cargo Hub', city: 'Jodhpur', gstin: '08AABCS4409F1Z9' },
        { email: 'cust.jdh10@titanfleet.dev', name: 'Dungar Singh Rathore', phone: '+91 98290 44010', company: 'Western Rajasthan Freight Carriers', city: 'Jodhpur', gstin: '08AABCW4410F1Z0' },
      ],
    },
  ];

  let totalCustomerCount = 0;
  const customerMap: Record<string, string> = {};

  for (const bCust of branchCustomerDefinitions) {
    const branchId = branchMap[bCust.branchCode];
    // Find parent franchise for this branch
    const branchConfig = branchConfigs.find((b) => b.code === bCust.branchCode)!;
    const franchiseId = franchiseMap[branchConfig.franchiseCode];

    for (const cData of bCust.customers) {
      totalCustomerCount++;

      // User account for customer portal login
      const custUser = await prisma.user.upsert({
        where: { email: cData.email },
        update: {
          accountType: AccountType.CUSTOMER,
          status: 'ACTIVE',
        },
        create: {
          email: cData.email,
          passwordHash: customerPasswordHash,
          accountType: AccountType.CUSTOMER,
          status: 'ACTIVE',
        },
      });

      // Customer profile with preferredBranchId and parent franchise link
      const customer = await prisma.customer.upsert({
        where: { userId: custUser.id },
        update: {
          name: cData.name,
          phone: cData.phone,
          email: cData.email,
          companyName: cData.company,
          customerType: CustomerType.BUSINESS,
          city: cData.city,
          state: 'Rajasthan',
          gstin: cData.gstin,
          status: CustomerStatus.ACTIVE,
          preferredBranchId: branchId,
        },
        create: {
          userId: custUser.id,
          name: cData.name,
          phone: cData.phone,
          email: cData.email,
          companyName: cData.company,
          customerType: CustomerType.BUSINESS,
          city: cData.city,
          state: 'Rajasthan',
          gstin: cData.gstin,
          status: CustomerStatus.ACTIVE,
          preferredBranchId: branchId,
        },
      });

      customerMap[cData.email] = customer.id;

      // Link to branch's franchise
      await prisma.customerFranchise.upsert({
        where: { customerId_franchiseId: { customerId: customer.id, franchiseId } },
        update: {},
        create: { customerId: customer.id, franchiseId },
      });
    }
  }
  console.log(`✅ Seeded exactly ${totalCustomerCount} customers (5 preferred per branch across 6 branches).`);

  // ==========================================
  // 10. SEED PHYSICAL INVENTORY (2 TRUCKS PER BRANCH = 12 TRUCKS TOTAL)
  // ==========================================
  console.log('🚛 Seeding physical inventory vehicles in all 6 branches...');
  const inventoryVehicles = [
    // Jaipur Central
    { vin: 'MB1TITANJAI01001', engine: 'ENG-AL-5525-0101', variantId: variantAvtr.id, branch: 'BR-JAI-01', color: 'Signal White', cost: 3500000, price: 3850000 },
    { vin: 'MB1TITANJAI01002', engine: 'ENG-AL-1215-0102', variantId: variantEcomet.id, branch: 'BR-JAI-01', color: 'Royal Blue', cost: 1950000, price: 2150000 },
    // Jaipur Industrial
    { vin: 'MB1TITANJAI02001', engine: 'ENG-AL-BDOST-0201', variantId: variantBadaDost.id, branch: 'BR-JAI-02', color: 'Golden Yellow', cost: 780000, price: 875000 },
    { vin: 'MB1TITANJAI02002', engine: 'ENG-AL-5525-0202', variantId: variantAvtr.id, branch: 'BR-JAI-02', color: 'Graphite Grey', cost: 3500000, price: 3850000 },
    // Udaipur Central
    { vin: 'MB1TITANUDR01001', engine: 'ENG-AL-5525-0301', variantId: variantAvtr.id, branch: 'BR-UDR-01', color: 'Signal White', cost: 3500000, price: 3850000 },
    { vin: 'MB1TITANUDR01002', engine: 'ENG-AL-1215-0302', variantId: variantEcomet.id, branch: 'BR-UDR-01', color: 'Forest Green', cost: 1950000, price: 2150000 },
    // Udaipur Industrial
    { vin: 'MB1TITANUDR02001', engine: 'ENG-AL-BDOST-0401', variantId: variantBadaDost.id, branch: 'BR-UDR-02', color: 'Silver Mist', cost: 780000, price: 875000 },
    { vin: 'MB1TITANUDR02002', engine: 'ENG-AL-1215-0402', variantId: variantEcomet.id, branch: 'BR-UDR-02', color: 'Signal White', cost: 1950000, price: 2150000 },
    // Jodhpur Central
    { vin: 'MB1TITANJDH01001', engine: 'ENG-AL-5525-0501', variantId: variantAvtr.id, branch: 'BR-JDH-01', color: 'Royal Blue', cost: 3500000, price: 3850000 },
    { vin: 'MB1TITANJDH01002', engine: 'ENG-AL-1215-0502', variantId: variantEcomet.id, branch: 'BR-JDH-01', color: 'Golden Yellow', cost: 1950000, price: 2150000 },
    // Jodhpur Industrial
    { vin: 'MB1TITANJDH02001', engine: 'ENG-AL-BDOST-0601', variantId: variantBadaDost.id, branch: 'BR-JDH-02', color: 'Signal White', cost: 780000, price: 875000 },
    { vin: 'MB1TITANJDH02002', engine: 'ENG-AL-5525-0602', variantId: variantAvtr.id, branch: 'BR-JDH-02', color: 'Desert Sand', cost: 3500000, price: 3850000 },
  ];

  for (const v of inventoryVehicles) {
    await prisma.vehicle.upsert({
      where: { vin: v.vin },
      update: {
        branchId: branchMap[v.branch],
        status: VehicleStatus.IN_STOCK,
        sellingPrice: v.price,
      },
      create: {
        vin: v.vin,
        engineNumber: v.engine,
        variantId: v.variantId,
        branchId: branchMap[v.branch],
        manufacturingYear: 2026,
        color: v.color,
        baseCost: v.cost,
        sellingPrice: v.price,
        status: VehicleStatus.IN_STOCK,
      },
    });
  }
  console.log(`✅ Seeded ${inventoryVehicles.length} inventory vehicles across 6 branches.`);

  // ==========================================
  // 11. SEED GENUINE SPARE PARTS AND STOCK IN ALL 6 BRANCHES
  // ==========================================
  console.log('🔧 Seeding spare parts inventory in all 6 branches...');
  const parts = [
    { partNumber: 'AL-FLT-AIR-01', name: 'Heavy Duty Primary Air Filter', category: 'Filtration', manufacturer: 'Ashok Leyland Genuine', unitPrice: 3200, gstRate: 18 },
    { partNumber: 'AL-CLT-PLT-02', name: 'Clutch Pressure Plate & Disc Assembly', category: 'Transmission', manufacturer: 'Ashok Leyland Genuine', unitPrice: 14500, gstRate: 18 },
    { partNumber: 'AL-BRK-LIN-03', name: 'Rear Axle Heavy Duty Brake Lining Set', category: 'Braking', manufacturer: 'Ashok Leyland Genuine', unitPrice: 5800, gstRate: 18 },
    { partNumber: 'AL-OIL-FLT-04', name: 'Spin-On Engine Oil Filter Cartridge', category: 'Filtration', manufacturer: 'Ashok Leyland Genuine', unitPrice: 1450, gstRate: 18 },
    { partNumber: 'AL-SUS-LEF-05', name: 'Multi-Leaf Heavy Axle Spring Bushing Kit', category: 'Suspension', manufacturer: 'Ashok Leyland Genuine', unitPrice: 7200, gstRate: 18 },
  ];

  for (const p of parts) {
    const part = await prisma.part.upsert({
      where: { partNumber: p.partNumber },
      update: { unitPrice: p.unitPrice, name: p.name },
      create: p,
    });

    for (const bCode of Object.keys(branchMap)) {
      await prisma.partStock.upsert({
        where: { partId_branchId: { partId: part.id, branchId: branchMap[bCode] } },
        update: {},
        create: {
          partId: part.id,
          branchId: branchMap[bCode],
          quantityOnHand: 20,
          quantityReserved: 0,
          reorderThreshold: 5,
        },
      });
    }
  }
  console.log(`✅ Seeded ${parts.length} parts with active stocks in all 6 branches.`);

  // =========================================================================
  // 12. SEED CONSISTENT SAMPLE TRANSACTIONS (QUOTATIONS, BOOKINGS, INVOICES, PAYMENTS)
  // =========================================================================
  console.log('📑 Seeding consistent sample transactions...');

  const sampleVehicleJaipur = await prisma.vehicle.findUnique({ where: { vin: 'MB1TITANJAI01001' } });
  const sampleVehicleUdaipur = await prisma.vehicle.findUnique({ where: { vin: 'MB1TITANUDR01001' } });

  // Representative quotation in Jaipur Central
  const quotationJai = await prisma.quotation.upsert({
    where: { quotationNumber: 'QT-2026-JAI-001' },
    update: {},
    create: {
      quotationNumber: 'QT-2026-JAI-001',
      customerId: customerMap['customer@rajasthanlogistics.com'],
      franchiseId: franchiseMap['FR-RAJ-01'],
      branchId: branchMap['BR-JAI-01'],
      salespersonEmployeeId: employeeMap['EMP-JAI-SALES01'],
      createdByUserId: adminUser.id,
      variantId: variantAvtr.id,
      quantity: 1,
      unitBasePrice: 3850000,
      accessoriesAmount: 50000,
      insuranceAmount: 45000,
      registrationAmount: 35000,
      discountAmount: 10000,
      subtotal: 3970000,
      gstRate: 28.0,
      gstAmount: 1111600,
      totalAmount: 5081600,
      validityDate: new Date('2026-12-31'),
      status: QuotationStatus.APPROVED,
      notes: 'Commercial quotation for AVTR 5525.T interstate haulage truck.',
    },
  });

  // Representative booking in Jaipur Central
  const bookingJai = await prisma.booking.upsert({
    where: { bookingNumber: 'BK-2026-JAI-001' },
    update: {},
    create: {
      bookingNumber: 'BK-2026-JAI-001',
      quotationId: quotationJai.id,
      customerId: customerMap['customer@rajasthanlogistics.com'],
      branchId: branchMap['BR-JAI-01'],
      salespersonEmployeeId: employeeMap['EMP-JAI-SALES01'],
      vehicleId: sampleVehicleJaipur?.id,
      bookingAmount: 500000,
      totalAmount: 5081600,
      status: BookingStatus.CONFIRMED,
      notes: 'Initial booking deposit received via Razorpay.',
    },
  });

  // Representative invoice in Jaipur Central
  const invoiceJai = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-JAI-001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-JAI-001',
      customerId: customerMap['customer@rajasthanlogistics.com'],
      branchId: branchMap['BR-JAI-01'],
      franchiseId: franchiseMap['FR-RAJ-01'],
      bookingId: bookingJai.id,
      vehicleId: sampleVehicleJaipur?.id,
      billingAddress: 'Plot 42, Sitapura Industrial Area, Tonk Road, Jaipur',
      gstin: '08AABCR1234F1Z1',
      subtotal: 3970000,
      discount: 10000,
      taxableAmount: 3960000,
      cgstAmount: 554400,
      sgstAmount: 554400,
      igstAmount: 0,
      totalAmount: 5068800,
      status: InvoiceStatus.ISSUED,
    },
  });

  // Representative payment in Jaipur Central
  await prisma.payment.upsert({
    where: { idempotencyKey: 'IDEM-PAY-JAI-001' },
    update: {},
    create: {
      bookingId: bookingJai.id,
      invoiceId: invoiceJai.id,
      gateway: 'RAZORPAY',
      gatewayOrderId: 'order_titan_jai_001',
      gatewayPaymentId: 'pay_titan_jai_001',
      idempotencyKey: 'IDEM-PAY-JAI-001',
      amount: 500000,
      currency: 'INR',
      status: PaymentStatus.SUCCESS,
      paidAt: new Date(),
    },
  });

  // Representative service appointment & job in Udaipur Central
  if (sampleVehicleUdaipur) {
    const appointmentUdr = await prisma.serviceAppointment.upsert({
      where: { appointmentNumber: 'APT-2026-UDR-001' },
      update: {},
      create: {
        appointmentNumber: 'APT-2026-UDR-001',
        customerId: customerMap['cust.udr1@titanfleet.dev'],
        vehicleId: sampleVehicleUdaipur.id,
        branchId: branchMap['BR-UDR-01'],
        serviceAdvisorId: employeeMap['EMP-UDR-CEN-ADV'],
        requestedService: 'Periodic Fleet Maintenance',
        preferredDate: new Date('2026-10-25T10:00:00Z'),
        status: AppointmentStatus.CONFIRMED,
        customerNotes: '50,000 km periodic engine service and brake inspection.',
      },
    });

    await prisma.serviceJob.upsert({
      where: { jobNumber: 'JOB-2026-UDR-001' },
      update: {},
      create: {
        jobNumber: 'JOB-2026-UDR-001',
        appointmentId: appointmentUdr.id,
        customerId: customerMap['cust.udr1@titanfleet.dev'],
        vehicleId: sampleVehicleUdaipur.id,
        branchId: branchMap['BR-UDR-01'],
        serviceAdvisorId: employeeMap['EMP-UDR-CEN-ADV'],
        assignedMechanicId: employeeMap['EMP-UDR-CEN-TECH'],
        complaint: 'Scheduled 50,000 km fleet service and inspection.',
        diagnosis: 'Engine oil and primary filters require routine change. Brake pads in acceptable condition.',
        estimatedCost: 18500,
        actualCost: 18500,
        status: ServiceJobStatus.IN_PROGRESS,
        notes: 'Job card opened for scheduled fleet servicing.',
      },
    });
  }

  // ==========================================
  // 13. SEED CUSTOMER-TO-BRANCH CHAT CONVERSATIONS
  // ==========================================
  console.log('💬 Seeding customer-to-branch chat conversations...');
  const customerUserJaipur = await prisma.user.findUnique({ where: { email: 'customer@rajasthanlogistics.com' } });
  const salesUserJaipur = await prisma.user.findUnique({ where: { email: 'sales.jaipur@titanauto.com' } });

  if (customerUserJaipur && salesUserJaipur) {
    const convo = await prisma.conversation.upsert({
      where: {
        customerId_branchId_contextType_contextId: {
          customerId: customerMap['customer@rajasthanlogistics.com'],
          branchId: branchMap['BR-JAI-01'],
          contextType: 'GENERAL',
          contextId: 'NONE',
        },
      },
      update: {},
      create: {
        customerId: customerMap['customer@rajasthanlogistics.com'],
        branchId: branchMap['BR-JAI-01'],
        assignedEmployeeId: employeeMap['EMP-JAI-SALES01'],
        subject: 'Interstate Fleet Delivery Timeline Inquiry',
        contextType: 'GENERAL',
        contextId: 'NONE',
        status: ConversationStatus.OPEN,
      },
    });

    const msgCount = await prisma.chatMessage.count({ where: { conversationId: convo.id } });
    if (msgCount === 0) {
      await prisma.chatMessage.create({
        data: {
          conversationId: convo.id,
          senderUserId: customerUserJaipur.id,
          senderType: MessageSenderType.CUSTOMER,
          message: 'Hello Jaipur team, could you please provide an update on the delivery schedule for our booked AVTR 5525.T truck?',
        },
      });

      await prisma.chatMessage.create({
        data: {
          conversationId: convo.id,
          senderUserId: salesUserJaipur.id,
          senderType: MessageSenderType.EMPLOYEE,
          message: 'Dear Mr. Vikram Singh, your vehicle is currently completing Pre-Delivery Inspection at our Sitapura yard. It will be ready for dispatch on Wednesday.',
        },
      });
    }
  }

  // =========================================================================
  // 14. AUTOMATED ASSERTION OF EXACT TARGET DATASET TOTALS
  // =========================================================================
  console.log('\n🔍 Verifying exact required dataset counts...');

  const finalFranchiseCount = await prisma.franchise.count();
  const finalBranchCount = await prisma.branch.count();
  const finalBranchEmployeesCount = await prisma.employee.count({
    where: {
      designation: { not: 'Global Platform Admin' },
      employeeCode: { notIn: ['EMP-ADM-001', 'EMP-FO-01', 'EMP-FO-02', 'EMP-FO-03'] },
    },
  });
  const finalCustomerCount = await prisma.customer.count();

  // City distribution
  const udaipurBranches = await prisma.branch.count({ where: { city: 'Udaipur' } });
  const jaipurBranches = await prisma.branch.count({ where: { city: 'Jaipur' } });
  const jodhpurBranches = await prisma.branch.count({ where: { city: 'Jodhpur' } });

  console.log(`   Franchises:       ${finalFranchiseCount} (Target: 3)`);
  console.log(`   Branches Total:   ${finalBranchCount} (Target: 6)`);
  console.log(`   - Udaipur:        ${udaipurBranches} (Target: 2)`);
  console.log(`   - Jaipur:         ${jaipurBranches} (Target: 2)`);
  console.log(`   - Jodhpur:        ${jodhpurBranches} (Target: 2)`);
  console.log(`   Branch Employees: ${finalBranchEmployeesCount} (Target: 30)`);
  console.log(`   Customers:        ${finalCustomerCount} (Target: 30)`);

  if (
    finalFranchiseCount !== 3 ||
    finalBranchCount !== 6 ||
    udaipurBranches !== 2 ||
    jaipurBranches !== 2 ||
    jodhpurBranches !== 2 ||
    finalBranchEmployeesCount !== 30 ||
    finalCustomerCount !== 30
  ) {
    throw new Error('❌ Data count verification failed! Target requirements not satisfied.');
  }

  console.log('\n🎉 ALL TARGET DATASET COUNTS EXACTLY MATCH SPECIFICATIONS!');
  console.log('🌱 Titan Auto Controlled Dataset Reset & Seed Workflow Succeeded.');
}

main()
  .catch((e) => {
    console.error('❌ Seed Workflow Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
