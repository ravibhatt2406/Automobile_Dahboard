import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Phase 4 — Branch-Wise Customer Management & Tenant Scoping Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let franchiseManagerToken: string;
  let branchManagerAToken: string;
  let branchManagerBToken: string;
  let customerAToken: string;
  let otherFranchiseManagerToken: string;

  let franchise1: any;
  let franchise2: any;
  let branchA: any;
  let branchB: any;
  let branchC: any; // Branch in Franchise 2

  let customer1: any; // Associated with Branch A (via Booking & Vehicle)
  let customer2: any; // Associated with Branch B (via ServiceJob)
  let customer3: any; // Associated with BOTH Branch A (Quotation) and Branch B (Vehicle)
  let customer4: any; // Associated with Branch C in Franchise 2

  const testPassword = 'Password@123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const ts = Date.now();
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // 1. Create Franchises
    franchise1 = await prisma.franchise.create({
      data: {
        code: `P4-FRAN-1-${ts}`,
        name: 'Rajasthan Commercial Trucks Hub',
        legalName: 'Rajasthan Commercial Trucks Pvt Ltd',
        taxId: `08FRAN1${ts.toString().slice(-4)}`,
        status: 'ACTIVE',
      },
    });

    franchise2 = await prisma.franchise.create({
      data: {
        code: `P4-FRAN-2-${ts}`,
        name: 'Gujarat Logistics Network Hub',
        legalName: 'Gujarat Logistics Network Ltd',
        taxId: `24FRAN2${ts.toString().slice(-4)}`,
        status: 'ACTIVE',
      },
    });

    // 2. Create Branches
    branchA = await prisma.branch.create({
      data: {
        franchiseId: franchise1.id,
        code: `P4-BRN-A-${ts}`,
        name: 'Jaipur Central Dealership',
        city: 'Jaipur',
        state: 'Rajasthan',
        status: 'ACTIVE',
      },
    });

    branchB = await prisma.branch.create({
      data: {
        franchiseId: franchise1.id,
        code: `P4-BRN-B-${ts}`,
        name: 'Jodhpur Heavy Vehicles Dealership',
        city: 'Jodhpur',
        state: 'Rajasthan',
        status: 'ACTIVE',
      },
    });

    branchC = await prisma.branch.create({
      data: {
        franchiseId: franchise2.id,
        code: `P4-BRN-C-${ts}`,
        name: 'Ahmedabad Port Fleet Center',
        city: 'Ahmedabad',
        state: 'Gujarat',
        status: 'ACTIVE',
      },
    });

    // 3. Create Truck Variant for quotations & vehicles
    let manufacturer = await prisma.manufacturer.findFirst();
    if (!manufacturer) {
      manufacturer = await prisma.manufacturer.create({
        data: { name: `Ashok Leyland Motors ${ts}` },
      });
    }
    const model = await prisma.truckModel.create({
      data: {
        manufacturerId: manufacturer.id,
        name: `Captain 28T-${ts}`,
      },
    });
    const variant = await prisma.truckVariant.create({
      data: {
        modelId: model.id,
        name: `2820 Heavy Hauler ${ts}`,
        basePrice: 3200000,
        gstRate: 28,
      },
    });

    // 4. Create Users & Employees
    // 4a. Super Admin
    const saUser = await prisma.user.create({
      data: {
        email: `sa.p4.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    // 4b. Franchise 1 Manager
    const fmRole = await prisma.role.findFirst({ where: { name: 'FRANCHISE_MANAGER' } });
    const fmUser = await prisma.user.create({
      data: {
        email: `fm.p4.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-FM-${ts}`,
            firstName: 'Vikram',
            lastName: 'Singh',
            designation: 'Franchise Director',
            status: 'ACTIVE',
            branchId: branchA.id,
            roleAssignments: fmRole ? { create: { roleId: fmRole.id } } : undefined,
          },
        },
      },
    });

    // 4c. Franchise 2 Manager
    const otherFmUser = await prisma.user.create({
      data: {
        email: `otherfm.p4.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-OFM-${ts}`,
            firstName: 'Kirit',
            lastName: 'Patel',
            designation: 'Gujarat Franchise Manager',
            status: 'ACTIVE',
            branchId: branchC.id,
            roleAssignments: fmRole ? { create: { roleId: fmRole.id } } : undefined,
          },
        },
      },
    });

    // 4d. Branch Manager A
    const bmRole = await prisma.role.findFirst({ where: { name: 'BRANCH_MANAGER' } });
    const bmUserA = await prisma.user.create({
      data: {
        email: `bma.p4.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-BMA-${ts}`,
            firstName: 'Rajesh',
            lastName: 'Sharma',
            designation: 'Jaipur Branch Manager',
            status: 'ACTIVE',
            branchId: branchA.id,
            roleAssignments: bmRole ? { create: { roleId: bmRole.id } } : undefined,
          },
        },
      },
      include: { employeeProfile: true },
    });

    // 4e. Branch Manager B
    const bmUserB = await prisma.user.create({
      data: {
        email: `bmb.p4.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-BMB-${ts}`,
            firstName: 'Anil',
            lastName: 'Choudhary',
            designation: 'Jodhpur Branch Manager',
            status: 'ACTIVE',
            branchId: branchB.id,
            roleAssignments: bmRole ? { create: { roleId: bmRole.id } } : undefined,
          },
        },
      },
    });

    // 5. Create Customers & Branch Associations
    // Customer 1: Associated with Branch A (Vehicle + Booking)
    const custUser1 = await prisma.user.create({
      data: {
        email: `customera.p4.${ts}@fleet.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            name: `Fleet Operator Alpha ${ts}`,
            email: `customera.p4.${ts}@fleet.com`,
            phone: `91${ts.toString().slice(-8)}`,
            customerType: 'BUSINESS',
            companyName: `Alpha Express Logistics ${ts}`,
            status: 'ACTIVE',
            franchiseLinks: { create: { franchiseId: franchise1.id } },
          },
        },
      },
      include: { customerProfile: true },
    });
    customer1 = custUser1.customerProfile!;

    const vehicleA = await prisma.vehicle.create({
      data: {
        vin: `VIN-P4-A-${ts}`,
        engineNumber: `ENG-P4-A-${ts}`,
        variantId: variant.id,
        branchId: branchA.id,
        customerId: customer1.id,
        status: 'DELIVERED',
        manufacturingYear: 2026,
        baseCost: 2800000,
        sellingPrice: 3300000,
      },
    });

    const quotationA = await prisma.quotation.create({
      data: {
        quotationNumber: `QT-P4-A-${ts}`,
        customerId: customer1.id,
        franchiseId: franchise1.id,
        branchId: branchA.id,
        salespersonEmployeeId: bmUserA.employeeProfile!.id,
        createdByUserId: bmUserA.id,
        variantId: variant.id,
        unitBasePrice: 3300000,
        subtotal: 3300000,
        gstRate: 28,
        gstAmount: 924000,
        totalAmount: 4224000,
        validityDate: new Date(Date.now() + 864000000),
        status: 'APPROVED',
      },
    });

    await prisma.booking.create({
      data: {
        bookingNumber: `BK-P4-A-${ts}`,
        customerId: customer1.id,
        quotationId: quotationA.id,
        vehicleId: vehicleA.id,
        branchId: branchA.id,
        salespersonEmployeeId: bmUserA.employeeProfile!.id,
        bookingAmount: 100000,
        totalAmount: 4224000,
        status: 'CONFIRMED',
      },
    });

    // Customer 2: Associated ONLY with Branch B (via ServiceJob)
    const custUser2 = await prisma.user.create({
      data: {
        email: `customerb.p4.${ts}@freight.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            name: `Independent Carrier Beta ${ts}`,
            email: `customerb.p4.${ts}@freight.com`,
            phone: `92${ts.toString().slice(-8)}`,
            customerType: 'INDIVIDUAL',
            companyName: `Beta Freight Lines ${ts}`,
            status: 'ACTIVE',
            franchiseLinks: { create: { franchiseId: franchise1.id } },
          },
        },
      },
      include: { customerProfile: true },
    });
    customer2 = custUser2.customerProfile!;

    const vehicleB = await prisma.vehicle.create({
      data: {
        vin: `VIN-P4-B-${ts}`,
        engineNumber: `ENG-P4-B-${ts}`,
        variantId: variant.id,
        branchId: branchB.id,
        customerId: customer2.id,
        status: 'DELIVERED',
        manufacturingYear: 2026,
        baseCost: 2800000,
        sellingPrice: 3300000,
      },
    });

    await prisma.serviceJob.create({
      data: {
        jobNumber: `SJ-P4-B-${ts}`,
        customerId: customer2.id,
        vehicleId: vehicleB.id,
        branchId: branchB.id,
        serviceAdvisorId: bmUserA.employeeProfile!.id,
        complaint: 'Routine 20,000 KM Periodic Hauler Overhaul',
        status: 'IN_PROGRESS',
      },
    });

    // Customer 3: MULTI-BRANCH (Quotation at Branch A, Vehicle & Service at Branch B)
    customer3 = await prisma.customer.create({
      data: {
        name: `Multi-Branch Fleet Operator Gamma ${ts}`,
        email: `customergamma.p4.${ts}@logistics.in`,
        phone: `93${ts.toString().slice(-8)}`,
        customerType: 'BUSINESS',
        companyName: `Gamma National Logistics Corp ${ts}`,
        status: 'ACTIVE',
        franchiseLinks: { create: { franchiseId: franchise1.id } },
      },
    });

    // Relation to Branch A
    await prisma.quotation.create({
      data: {
        quotationNumber: `QT-P4-GAMMA-A-${ts}`,
        customerId: customer3.id,
        franchiseId: franchise1.id,
        branchId: branchA.id,
        salespersonEmployeeId: bmUserA.employeeProfile!.id,
        createdByUserId: bmUserA.id,
        variantId: variant.id,
        unitBasePrice: 3400000,
        subtotal: 3400000,
        gstRate: 28,
        gstAmount: 952000,
        totalAmount: 4352000,
        validityDate: new Date(Date.now() + 864000000),
        status: 'SUBMITTED',
      },
    });

    // Relation to Branch B
    await prisma.vehicle.create({
      data: {
        vin: `VIN-P4-GAMMA-B-${ts}`,
        engineNumber: `ENG-P4-GAMMA-B-${ts}`,
        variantId: variant.id,
        branchId: branchB.id,
        customerId: customer3.id,
        status: 'IN_STOCK',
        manufacturingYear: 2026,
        baseCost: 2800000,
        sellingPrice: 3400000,
      },
    });

    // Customer 4: Associated ONLY with Franchise 2 (Branch C in Ahmedabad)
    customer4 = await prisma.customer.create({
      data: {
        name: `Gujarat Port Carrier Delta ${ts}`,
        email: `customerdelta.p4.${ts}@portcargo.com`,
        phone: `94${ts.toString().slice(-8)}`,
        customerType: 'BUSINESS',
        companyName: `Delta Maritime Cargo ${ts}`,
        status: 'ACTIVE',
        franchiseLinks: { create: { franchiseId: franchise2.id } },
      },
    });

    await prisma.vehicle.create({
      data: {
        vin: `VIN-P4-DELTA-C-${ts}`,
        engineNumber: `ENG-P4-DELTA-C-${ts}`,
        variantId: variant.id,
        branchId: branchC.id,
        customerId: customer4.id,
        status: 'IN_STOCK',
        manufacturingYear: 2026,
        baseCost: 2900000,
        sellingPrice: 3500000,
      },
    });

    // Helper to log in and get valid token
    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: testPassword });
      return res.body.data?.accessToken || res.body.accessToken;
    };

    superAdminToken = await login(saUser.email);
    franchiseManagerToken = await login(fmUser.email);
    otherFranchiseManagerToken = await login(otherFmUser.email);
    branchManagerAToken = await login(bmUserA.email);
    branchManagerBToken = await login(bmUserB.email);
    customerAToken = await login(custUser1.email);
  });

  afterAll(async () => {
    await app.close();
  });

  // ========================================================
  // TEST 1: Employees cannot directly create customer records
  // ========================================================
  it('1. Rejects employee attempt to call POST /customers with 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        name: 'Illegal Employee Created Customer',
        phone: '9988776655',
        customerType: 'INDIVIDUAL',
      })
      .expect(403);

    expect(res.body.message).toBeDefined();
  });

  // ========================================================
  // TEST 2: Public customer self-registration remains functional
  // ========================================================
  it('2. Public customer self-registration remains functional via /auth/register', async () => {
    const regTs = Date.now();
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: `Public Fleet Client ${regTs}`,
        email: `selfreg.${regTs}@client.com`,
        phone: `95${regTs.toString().slice(-8)}`,
        password: 'Password@123',
        termsAccepted: true,
      })
      .expect(201);

    const body = regRes.body.data || regRes.body;
    expect(body.user).toBeDefined();
    expect(body.user.customer?.name).toContain('Public Fleet Client');
    expect(body.accessToken).toBeDefined();
  });

  // ========================================================
  // TEST 3: Branch employees see ONLY their permitted branch customers
  // ========================================================
  it('3. Branch Manager A sees Customer 1 and multi-branch Customer 3, but CANNOT see Customer 2 (Branch B only)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .expect(200);

    const body = res.body.data || res.body;
    const items = body.items || body.data || [];
    const customerIds = items.map((c: any) => c.id);

    expect(customerIds).toContain(customer1.id);
    expect(customerIds).toContain(customer3.id);
    expect(customerIds).not.toContain(customer2.id); // Customer 2 is Branch B only
    expect(customerIds).not.toContain(customer4.id); // Customer 4 is Franchise 2
  });

  it('4. Branch Manager B sees Customer 2 and multi-branch Customer 3, but CANNOT see Customer 1 (Branch A only)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${branchManagerBToken}`)
      .expect(200);

    const body = res.body.data || res.body;
    const items = body.items || body.data || [];
    const customerIds = items.map((c: any) => c.id);

    expect(customerIds).toContain(customer2.id);
    expect(customerIds).toContain(customer3.id);
    expect(customerIds).not.toContain(customer1.id); // Customer 1 is Branch A only
    expect(customerIds).not.toContain(customer4.id); // Customer 4 is Franchise 2
  });

  // ========================================================
  // TEST 5: Franchise Manager sees customers in their franchise branches
  // ========================================================
  it('5. Franchise 1 Manager sees Customer 1, 2, and 3, but CANNOT see Customer 4 (Franchise 2)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${franchiseManagerToken}`)
      .expect(200);

    const body = res.body.data || res.body;
    const items = body.items || body.data || [];
    const customerIds = items.map((c: any) => c.id);

    expect(customerIds).toContain(customer1.id);
    expect(customerIds).toContain(customer2.id);
    expect(customerIds).toContain(customer3.id);
    expect(customerIds).not.toContain(customer4.id); // Franchise 2
  });

  // ========================================================
  // TEST 6: Super Admin retains global access
  // ========================================================
  it('6. SUPER_ADMIN retains global access to customers across all franchises and branches', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const body = res.body.data || res.body;
    const items = body.items || body.data || [];
    const customerIds = items.map((c: any) => c.id);

    expect(customerIds).toContain(customer1.id);
    expect(customerIds).toContain(customer2.id);
    expect(customerIds).toContain(customer3.id);
    expect(customerIds).toContain(customer4.id);
  });

  // ========================================================
  // TEST 7: Cross-branch Customer 360 detail access is denied
  // ========================================================
  it('7. Denies Branch Manager A from viewing Customer 2 (Branch B) with 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/customers/${customer2.id}`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .expect(403);

    expect(res.body.message).toContain('Multi-tenant scope violation');
  });

  it('8. Permits Branch Manager A to view Customer 1 (Branch A) and Customer 3 (multi-branch)', async () => {
    // Customer 1
    const res1 = await request(app.getHttpServer())
      .get(`/api/v1/customers/${customer1.id}`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .expect(200);
    const body1 = res1.body.data || res1.body;
    expect(body1.id).toBe(customer1.id);
    expect(body1.bookings.length).toBeGreaterThan(0);

    // Customer 3 (Multi-branch)
    const res3 = await request(app.getHttpServer())
      .get(`/api/v1/customers/${customer3.id}`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .expect(200);
    const body3 = res3.body.data || res3.body;
    expect(body3.id).toBe(customer3.id);
  });

  // ========================================================
  // TEST 9: Customer directory enumeration by customer is denied
  // ========================================================
  it('9. Denies customer from enumerating customer directory with 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${customerAToken}`)
      .expect(403);
  });

  // ========================================================
  // TEST 10: Search and filtering within authorized tenant scope
  // ========================================================
  it('10. Scoped search and filtering strictly confines results to the authorized branch', async () => {
    // Branch Manager A searches for 'Beta' (Customer 2 in Branch B)
    const searchRes = await request(app.getHttpServer())
      .get('/api/v1/customers?search=Beta')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .expect(200);

    const body = searchRes.body.data || searchRes.body;
    const items = body.items || body.data || [];
    // Even though 'Beta' matches Customer 2, it is outside Branch A's scope, so it returns 0 results
    expect(items.length).toBe(0);

    // Branch Manager B searches for 'Beta' -> finds Customer 2
    const searchResB = await request(app.getHttpServer())
      .get('/api/v1/customers?search=Beta')
      .set('Authorization', `Bearer ${branchManagerBToken}`)
      .expect(200);

    const bodyB = searchResB.body.data || searchResB.body;
    const itemsB = bodyB.items || bodyB.data || [];
    expect(itemsB.length).toBe(1);
    expect(itemsB[0].id).toBe(customer2.id);
  });
});
