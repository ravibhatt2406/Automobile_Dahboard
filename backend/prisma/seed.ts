import { PrismaClient, VehicleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Titan Auto Complete Database Seed Process...');

  // 1. Seed System Roles
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
  console.log(`✅ Seeded ${roles.length} system roles`);

  // 2. Seed System Permissions
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
  console.log(`✅ Seeded ${permissions.length} granular permissions`);

  // 3. Seed Role-Permission Relationships
  const rolePermissionAssignments: Array<{ roleName: string; perms: string[] }> = [
    {
      roleName: 'SUPER_ADMIN',
      perms: Object.keys(permMap),
    },
    {
      roleName: 'FRANCHISE_OWNER',
      perms: [
        'franchise.read',
        'branch.create',
        'branch.read',
        'branch.update',
        'employee.create',
        'employee.read',
        'employee.update',
        'employee.approve',
        'employee.deactivate',
        'customer.create',
        'customer.read',
        'customer.update',
        'inventory.create',
        'inventory.read',
        'inventory.update',
        'sales.create',
        'sales.read',
        'sales.update',
        'service.read',
        'reports.read',
      ],
    },
    {
      roleName: 'BRANCH_MANAGER',
      perms: [
        'branch.read',
        'employee.create',
        'employee.read',
        'employee.approve',
        'employee.deactivate',
        'customer.create',
        'customer.read',
        'customer.update',
        'inventory.create',
        'inventory.read',
        'inventory.update',
        'sales.create',
        'sales.read',
        'sales.update',
        'service.create',
        'service.read',
        'service.update',
        'reports.read',
      ],
    },
    {
      roleName: 'SALES_EMPLOYEE',
      perms: [
        'customer.create',
        'customer.read',
        'customer.update',
        'inventory.read',
        'sales.create',
        'sales.read',
        'sales.update',
      ],
    },
    {
      roleName: 'MECHANIC',
      perms: [
        'inventory.read',
        'service.read',
        'service.update',
      ],
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
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    }
  }
  console.log('✅ Configured Role-Permission matrices');

  // 4. Seed Ashok Leyland Manufacturer
  const ashokManufacturer = await prisma.manufacturer.upsert({
    where: { name: 'Ashok Leyland' },
    update: { country: 'India', status: 'ACTIVE' },
    create: {
      name: 'Ashok Leyland',
      country: 'India',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Manufacturer: ${ashokManufacturer.name}`);

  // 5. Seed Ashok Leyland Models & Variants
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
  console.log('✅ Seeded Ashok Leyland Models and Variants');

  // 6. Seed Franchise (Ashok Leyland Commercial Network)
  const alFranchise = await prisma.franchise.upsert({
    where: { code: 'FR-AL-01' },
    update: {
      name: 'Ashok Leyland Commercial Vehicles',
      legalName: 'Ashok Leyland Dealership Network Ltd',
      status: 'ACTIVE',
    },
    create: {
      code: 'FR-AL-01',
      name: 'Ashok Leyland Commercial Vehicles',
      legalName: 'Ashok Leyland Dealership Network Ltd',
      taxId: 'GSTIN08ALIND2026',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Franchise: ${alFranchise.name} (${alFranchise.code})`);

  // 7. Seed Jaipur Branch
  const jaipurBranch = await prisma.branch.upsert({
    where: { code: 'BR-JAI-01' },
    update: {
      name: 'Jaipur',
      city: 'Jaipur',
      state: 'Rajasthan',
      status: 'ACTIVE',
    },
    create: {
      franchiseId: alFranchise.id,
      code: 'BR-JAI-01',
      name: 'Jaipur',
      address: 'Plot 42, Sitapura Industrial Area, Tonk Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Branch: ${jaipurBranch.name} (${jaipurBranch.code})`);

  // 8. Seed Key Users and Roles
  const defaultPasswordHash = await bcrypt.hash('Admin123!', 10);
  const managerPasswordHash = await bcrypt.hash('Manager123!', 10);
  const salesPasswordHash = await bcrypt.hash('Sales123!', 10);
  const mechanicPasswordHash = await bcrypt.hash('Mechanic123!', 10);
  const customerPasswordHash = await bcrypt.hash('Customer123!', 10);

  // A. Super Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@titanauto.com' },
    update: { passwordHash: defaultPasswordHash, status: 'ACTIVE' },
    create: {
      email: 'admin@titanauto.com',
      passwordHash: defaultPasswordHash,
      accountType: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const adminEmp = await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: { status: 'ACTIVE', branchId: jaipurBranch.id },
    create: {
      userId: adminUser.id,
      branchId: jaipurBranch.id,
      employeeCode: 'EMP-ADM-001',
      firstName: 'Alexander',
      lastName: 'Vance',
      designation: 'Global Platform Admin',
      status: 'ACTIVE',
    },
  });

  await prisma.employeeRoleAssignment.upsert({
    where: { employeeId_roleId: { employeeId: adminEmp.id, roleId: roleMap['SUPER_ADMIN'] } },
    update: {},
    create: { employeeId: adminEmp.id, roleId: roleMap['SUPER_ADMIN'] },
  });

  // B. Branch Manager (Jaipur)
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager.jaipur@titanauto.com' },
    update: { passwordHash: managerPasswordHash, status: 'ACTIVE' },
    create: {
      email: 'manager.jaipur@titanauto.com',
      passwordHash: managerPasswordHash,
      accountType: 'EMPLOYEE',
      status: 'ACTIVE',
    },
  });

  const managerEmp = await prisma.employee.upsert({
    where: { userId: managerUser.id },
    update: { status: 'ACTIVE', branchId: jaipurBranch.id },
    create: {
      userId: managerUser.id,
      branchId: jaipurBranch.id,
      employeeCode: 'EMP-JAI-MGR01',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      designation: 'Branch General Manager',
      status: 'ACTIVE',
    },
  });

  await prisma.employeeRoleAssignment.upsert({
    where: { employeeId_roleId: { employeeId: managerEmp.id, roleId: roleMap['BRANCH_MANAGER'] } },
    update: {},
    create: { employeeId: managerEmp.id, roleId: roleMap['BRANCH_MANAGER'] },
  });

  // C. Sales Executive (Jaipur)
  const salesUser = await prisma.user.upsert({
    where: { email: 'sales.jaipur@titanauto.com' },
    update: { passwordHash: salesPasswordHash, status: 'ACTIVE' },
    create: {
      email: 'sales.jaipur@titanauto.com',
      passwordHash: salesPasswordHash,
      accountType: 'EMPLOYEE',
      status: 'ACTIVE',
    },
  });

  const salesEmp = await prisma.employee.upsert({
    where: { userId: salesUser.id },
    update: { status: 'ACTIVE', branchId: jaipurBranch.id },
    create: {
      userId: salesUser.id,
      branchId: jaipurBranch.id,
      employeeCode: 'EMP-JAI-SALES01',
      firstName: 'Amit',
      lastName: 'Verma',
      designation: 'Commercial Sales Executive',
      status: 'ACTIVE',
    },
  });

  await prisma.employeeRoleAssignment.upsert({
    where: { employeeId_roleId: { employeeId: salesEmp.id, roleId: roleMap['SALES_EMPLOYEE'] } },
    update: {},
    create: { employeeId: salesEmp.id, roleId: roleMap['SALES_EMPLOYEE'] },
  });

  // D. Mechanic / Technician (Jaipur)
  const mechanicUser = await prisma.user.upsert({
    where: { email: 'mechanic.jaipur@titanauto.com' },
    update: { passwordHash: mechanicPasswordHash, status: 'ACTIVE' },
    create: {
      email: 'mechanic.jaipur@titanauto.com',
      passwordHash: mechanicPasswordHash,
      accountType: 'EMPLOYEE',
      status: 'ACTIVE',
    },
  });

  const mechanicEmp = await prisma.employee.upsert({
    where: { userId: mechanicUser.id },
    update: { status: 'ACTIVE', branchId: jaipurBranch.id },
    create: {
      userId: mechanicUser.id,
      branchId: jaipurBranch.id,
      employeeCode: 'EMP-JAI-TECH01',
      firstName: 'Rahul',
      lastName: 'Saini',
      designation: 'Senior Heavy Commercial Technician',
      status: 'ACTIVE',
    },
  });

  await prisma.employeeRoleAssignment.upsert({
    where: { employeeId_roleId: { employeeId: mechanicEmp.id, roleId: roleMap['MECHANIC'] } },
    update: {},
    create: { employeeId: mechanicEmp.id, roleId: roleMap['MECHANIC'] },
  });

  // E. Customer Account
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@rajasthanlogistics.com' },
    update: { passwordHash: customerPasswordHash, status: 'ACTIVE' },
    create: {
      email: 'customer@rajasthanlogistics.com',
      passwordHash: customerPasswordHash,
      accountType: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: { status: 'ACTIVE' },
    create: {
      userId: customerUser.id,
      name: 'Vikram Singh Shekhawat',
      phone: '+91 98290 12345',
      email: 'customer@rajasthanlogistics.com',
      companyName: 'Rajasthan Logistics & Freight Corp',
      customerType: 'BUSINESS',
      address: 'Industrial Plot 18, Transport Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302003',
      gstin: '08AABCR1234F1Z8',
      status: 'ACTIVE',
    },
  });

  await prisma.customerFranchise.upsert({
    where: { customerId_franchiseId: { customerId: customer.id, franchiseId: alFranchise.id } },
    update: {},
    create: { customerId: customer.id, franchiseId: alFranchise.id },
  });

  console.log('✅ Seeded Users: Admin, Jaipur Branch Manager, Sales Executive, Mechanic, Fleet Customer');

  // 9. Seed Physical Inventory in Jaipur Branch
  const vehicles = [
    {
      vin: 'MB1A2B3C4D5E6F701',
      engineNumber: 'ENG-AL-AVTR-001',
      variantId: variantAvtr.id,
      branchId: jaipurBranch.id,
      manufacturingYear: 2026,
      color: 'Signal White',
      baseCost: 3500000,
      sellingPrice: 3850000,
      status: VehicleStatus.IN_STOCK,
    },
    {
      vin: 'MB1A2B3C4D5E6F702',
      engineNumber: 'ENG-AL-ECOMET-002',
      variantId: variantEcomet.id,
      branchId: jaipurBranch.id,
      manufacturingYear: 2026,
      color: 'Royal Blue',
      baseCost: 1950000,
      sellingPrice: 2150000,
      status: VehicleStatus.IN_STOCK,
    },
    {
      vin: 'MB1A2B3C4D5E6F703',
      engineNumber: 'ENG-AL-BDOST-003',
      variantId: variantBadaDost.id,
      branchId: jaipurBranch.id,
      manufacturingYear: 2026,
      color: 'Golden Yellow',
      baseCost: 780000,
      sellingPrice: 875000,
      status: VehicleStatus.IN_STOCK,
    },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { vin: v.vin },
      update: { status: v.status, branchId: v.branchId },
      create: v,
    });
  }
  console.log(`✅ Seeded ${vehicles.length} inventory trucks in Jaipur Branch`);

  // 10. Seed Spare Parts & Inventory in Jaipur Branch
  const parts = [
    {
      partNumber: 'AL-FLT-AIR-01',
      name: 'High Performance Primary Air Filter',
      category: 'Filtration',
      manufacturer: 'Ashok Leyland Genuine',
      unitPrice: 3200,
      gstRate: 18,
    },
    {
      partNumber: 'AL-CLT-PLT-02',
      name: 'Clutch Pressure Plate & Disc Assembly',
      category: 'Transmission',
      manufacturer: 'Ashok Leyland Genuine',
      unitPrice: 14500,
      gstRate: 18,
    },
    {
      partNumber: 'AL-BRK-LIN-03',
      name: 'Rear Axle Heavy Duty Brake Lining Set',
      category: 'Braking',
      manufacturer: 'Ashok Leyland Genuine',
      unitPrice: 5800,
      gstRate: 18,
    },
  ];

  for (const p of parts) {
    const part = await prisma.part.upsert({
      where: { partNumber: p.partNumber },
      update: { unitPrice: p.unitPrice },
      create: p,
    });

    await prisma.partStock.upsert({
      where: { partId_branchId: { partId: part.id, branchId: jaipurBranch.id } },
      update: {},
      create: {
        partId: part.id,
        branchId: jaipurBranch.id,
        quantityOnHand: 25,
        quantityReserved: 0,
        reorderThreshold: 5,
      },
    });
  }
  console.log(`✅ Seeded ${parts.length} genuine spare parts with stock in Jaipur Branch`);

  console.log('🌱 Titan Auto Complete Database Seed Process Succeeded.');
}

main()
  .catch((e) => {
    console.error('❌ Seed Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
