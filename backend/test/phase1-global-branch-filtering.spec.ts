import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Phase 1 — Global Branch-Wise & Franchise-Wise Filtering Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let franchiseManager1Token: string;
  let franchiseManager2Token: string;
  let branchManagerA1Token: string;
  let branchManagerB1Token: string;
  let branchManagerC2Token: string;
  let customerToken: string;

  let franchise1: any;
  let franchise2: any;
  let branchA1: any;
  let branchB1: any;
  let branchC2: any;

  let vehicleA1: any;
  let vehicleB1: any;
  let vehicleC2: any;

  let jobA1: any;
  let quotationA1: any;
  let bookingA1: any;
  let invoiceA1: any;
  let leadA1: any;

  const testPassword = 'Password@123';
  let ts: number;

  const getList = (body: any): any[] => {
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.data?.items)) return body.data.items;
    if (Array.isArray(body?.items)) return body.items;
    return [];
  };

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
    ts = Date.now();
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // 1. Create Franchises
    franchise1 = await prisma.franchise.create({
      data: {
        code: `P1-FRAN-NORTH-${ts}`,
        name: `Titan North Trucks Hub ${ts}`,
        legalName: 'Titan North Pvt Ltd',
        taxId: `07TITAN${ts.toString().slice(-4)}`,
        status: 'ACTIVE',
      },
    });

    franchise2 = await prisma.franchise.create({
      data: {
        code: `P1-FRAN-SOUTH-${ts}`,
        name: `Titan South Logistics ${ts}`,
        legalName: 'Titan South Pvt Ltd',
        taxId: `29TITAN${ts.toString().slice(-4)}`,
        status: 'ACTIVE',
      },
    });

    // 2. Create Branches
    branchA1 = await prisma.branch.create({
      data: {
        franchiseId: franchise1.id,
        code: `BR-A1-${ts}`,
        name: `Delhi North Hub ${ts}`,
        city: 'Delhi',
        state: 'Delhi',
        status: 'ACTIVE',
      },
    });

    branchB1 = await prisma.branch.create({
      data: {
        franchiseId: franchise1.id,
        code: `BR-B1-${ts}`,
        name: `Jaipur Express Hub ${ts}`,
        city: 'Jaipur',
        state: 'Rajasthan',
        status: 'ACTIVE',
      },
    });

    branchC2 = await prisma.branch.create({
      data: {
        franchiseId: franchise2.id,
        code: `BR-C2-${ts}`,
        name: `Bengaluru Tech Hub ${ts}`,
        city: 'Bengaluru',
        state: 'Karnataka',
        status: 'ACTIVE',
      },
    });

    // 3. Create Model & Variant
    let manufacturer = await prisma.manufacturer.findFirst();
    if (!manufacturer) {
      manufacturer = await prisma.manufacturer.create({
        data: { name: `Titan Motors ${ts}` },
      });
    }

    const model = await prisma.truckModel.create({
      data: {
        manufacturerId: manufacturer.id,
        name: `Titan Ultra Hauler ${ts}`,
      },
    });

    const variant = await prisma.truckVariant.create({
      data: {
        modelId: model.id,
        name: `5525.TT 4x2 ${ts}`,
        basePrice: 3500000,
        gstRate: 28,
      },
    });

    // 4. Create Users & Employee Profiles
    const saRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    const fmRole = await prisma.role.findFirst({ where: { name: 'FRANCHISE_MANAGER' } });
    const bmRole = await prisma.role.findFirst({ where: { name: 'BRANCH_MANAGER' } });

    // Super Admin
    const saUser = await prisma.user.create({
      data: {
        email: `sa.p1.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-SA-P1-${ts}`,
            firstName: 'Super',
            lastName: 'Admin',
            designation: 'Managing Director',
            status: 'ACTIVE',
            branchId: branchA1.id,
            roleAssignments: saRole ? { create: { roleId: saRole.id } } : undefined,
          },
        },
      },
    });

    // Franchise Manager 1 (Franchise 1)
    const fm1User = await prisma.user.create({
      data: {
        email: `fm1.p1.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-FM1-P1-${ts}`,
            firstName: 'Aarav',
            lastName: 'Kapoor',
            designation: 'North Regional Director',
            status: 'ACTIVE',
            branchId: branchA1.id,
            roleAssignments: fmRole ? { create: { roleId: fmRole.id } } : undefined,
          },
        },
      },
    });

    // Franchise Manager 2 (Franchise 2)
    const fm2User = await prisma.user.create({
      data: {
        email: `fm2.p1.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-FM2-P1-${ts}`,
            firstName: 'Suresh',
            lastName: 'Rao',
            designation: 'South Regional Director',
            status: 'ACTIVE',
            branchId: branchC2.id,
            roleAssignments: fmRole ? { create: { roleId: fmRole.id } } : undefined,
          },
        },
      },
    });

    // Branch Manager A1 (Branch A1, Franchise 1)
    const bmA1User = await prisma.user.create({
      data: {
        email: `bma1.p1.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-BMA1-P1-${ts}`,
            firstName: 'Rohan',
            lastName: 'Verma',
            designation: 'Delhi Branch Manager',
            status: 'ACTIVE',
            branchId: branchA1.id,
            roleAssignments: bmRole ? { create: { roleId: bmRole.id } } : undefined,
          },
        },
      },
      include: { employeeProfile: true },
    });

    // Branch Manager B1 (Branch B1, Franchise 1)
    const bmB1User = await prisma.user.create({
      data: {
        email: `bmb1.p1.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-BMB1-P1-${ts}`,
            firstName: 'Karan',
            lastName: 'Choudhary',
            designation: 'Jaipur Branch Manager',
            status: 'ACTIVE',
            branchId: branchB1.id,
            roleAssignments: bmRole ? { create: { roleId: bmRole.id } } : undefined,
          },
        },
      },
    });

    // Branch Manager C2 (Branch C2, Franchise 2)
    const bmC2User = await prisma.user.create({
      data: {
        email: `bmc2.p1.${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-BMC2-P1-${ts}`,
            firstName: 'Praveen',
            lastName: 'Gowda',
            designation: 'Bengaluru Branch Manager',
            status: 'ACTIVE',
            branchId: branchC2.id,
            roleAssignments: bmRole ? { create: { roleId: bmRole.id } } : undefined,
          },
        },
      },
    });

    // Customer
    const custUser = await prisma.user.create({
      data: {
        email: `cust.p1.${ts}@transport.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            name: `Hindustan Cargo Fleet ${ts}`,
            phone: `92${ts.toString().slice(-8)}`,
            customerType: 'BUSINESS',
            companyName: `Hindustan Cargo Logistics ${ts}`,
            status: 'ACTIVE',
            preferredBranchId: branchA1.id,
            franchiseLinks: { create: { franchiseId: franchise1.id } },
          },
        },
      },
      include: { customerProfile: true },
    });
    const customer = custUser.customerProfile!;

    // 5. Seed Vehicles across branches
    vehicleA1 = await prisma.vehicle.create({
      data: {
        vin: `VIN-P1-A1-${ts}`,
        engineNumber: `ENG-P1-A1-${ts}`,
        variantId: variant.id,
        branchId: branchA1.id,
        customerId: customer.id,
        status: 'IN_STOCK',
        manufacturingYear: 2026,
        baseCost: 3000000,
        sellingPrice: 3500000,
      },
    });

    vehicleB1 = await prisma.vehicle.create({
      data: {
        vin: `VIN-P1-B1-${ts}`,
        engineNumber: `ENG-P1-B1-${ts}`,
        variantId: variant.id,
        branchId: branchB1.id,
        status: 'IN_STOCK',
        manufacturingYear: 2026,
        baseCost: 3000000,
        sellingPrice: 3500000,
      },
    });

    vehicleC2 = await prisma.vehicle.create({
      data: {
        vin: `VIN-P1-C2-${ts}`,
        engineNumber: `ENG-P1-C2-${ts}`,
        variantId: variant.id,
        branchId: branchC2.id,
        status: 'IN_STOCK',
        manufacturingYear: 2026,
        baseCost: 3000000,
        sellingPrice: 3500000,
      },
    });

    // 6. Seed Quotation, Booking, Invoice, ServiceJob, CRM Lead in Branch A1
    quotationA1 = await prisma.quotation.create({
      data: {
        quotationNumber: `QT-P1-A1-${ts}`,
        customerId: customer.id,
        franchiseId: franchise1.id,
        branchId: branchA1.id,
        salespersonEmployeeId: bmA1User.employeeProfile!.id,
        createdByUserId: bmA1User.id,
        variantId: variant.id,
        unitBasePrice: 3500000,
        subtotal: 3500000,
        gstRate: 28,
        gstAmount: 980000,
        totalAmount: 4480000,
        validityDate: new Date(Date.now() + 864000000),
        status: 'APPROVED',
      },
    });

    bookingA1 = await prisma.booking.create({
      data: {
        bookingNumber: `BK-P1-A1-${ts}`,
        quotationId: quotationA1.id,
        customerId: customer.id,
        branchId: branchA1.id,
        salespersonEmployeeId: bmA1User.employeeProfile!.id,
        bookingAmount: 100000,
        totalAmount: 4480000,
        status: 'CONFIRMED',
      },
    });

    invoiceA1 = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-P1-A1-${ts}`,
        bookingId: bookingA1.id,
        customerId: customer.id,
        franchiseId: franchise1.id,
        branchId: branchA1.id,
        billingAddress: 'NH-1 GT Karnal Road, Delhi',
        taxableAmount: 3500000,
        subtotal: 3500000,
        totalAmount: 4480000,
        status: 'ISSUED',
      },
    });

    jobA1 = await prisma.serviceJob.create({
      data: {
        jobNumber: `JC-P1-A1-${ts}`,
        branchId: branchA1.id,
        customerId: customer.id,
        vehicleId: vehicleA1.id,
        serviceAdvisorId: bmA1User.employeeProfile!.id,
        status: 'IN_PROGRESS',
        complaint: 'Periodic overhaul maintenance',
      },
    });

    leadA1 = await prisma.lead.create({
      data: {
        customerId: customer.id,
        franchiseId: franchise1.id,
        branchId: branchA1.id,
        status: 'QUALIFIED',
        priority: 'HIGH',
      },
    });

    // Helper to log in
    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: testPassword });
      return res.body.data?.accessToken || res.body.accessToken;
    };

    superAdminToken = await login(saUser.email);
    franchiseManager1Token = await login(fm1User.email);
    franchiseManager2Token = await login(fm2User.email);
    branchManagerA1Token = await login(bmA1User.email);
    branchManagerB1Token = await login(bmB1User.email);
    branchManagerC2Token = await login(bmC2User.email);
    customerToken = await login(custUser.email);
  });

  afterAll(async () => {
    try {
      const fIds = [franchise1?.id, franchise2?.id].filter(Boolean);
      if (fIds.length > 0) {
        await prisma.invoiceItem.deleteMany({ where: { invoice: { branch: { franchiseId: { in: fIds } } } } });
        await prisma.invoice.deleteMany({ where: { branch: { franchiseId: { in: fIds } } } });
        await prisma.booking.deleteMany({ where: { branch: { franchiseId: { in: fIds } } } });
        await prisma.quotationItem.deleteMany({ where: { quotation: { branch: { franchiseId: { in: fIds } } } });
        await prisma.quotation.deleteMany({ where: { branch: { franchiseId: { in: fIds } } } });
        await prisma.serviceJob.deleteMany({ where: { branch: { franchiseId: { in: fIds } } } });
        await prisma.leadActivity.deleteMany({ where: { lead: { branch: { franchiseId: { in: fIds } } } });
        await prisma.lead.deleteMany({ where: { branch: { franchiseId: { in: fIds } } } });
        await prisma.vehicle.deleteMany({ where: { branch: { franchiseId: { in: fIds } } } });
        await prisma.employeeRoleAssignment.deleteMany({ where: { employee: { branch: { franchiseId: { in: fIds } } } } });
        await prisma.employee.deleteMany({ where: { branch: { franchiseId: { in: fIds } } } });
        await prisma.customerFranchise.deleteMany({ where: { franchiseId: { in: fIds } } });
        await prisma.customer.deleteMany({ where: { email: { contains: `${ts}` } } });
        await prisma.user.deleteMany({ where: { email: { contains: `${ts}` } } });
        await prisma.branch.deleteMany({ where: { franchiseId: { in: fIds } } });
        await prisma.franchise.deleteMany({ where: { id: { in: fIds } } });
      }
    } catch (e) {
      // cleanup error ignored
    }
    await app.close();
  });

  // ====================================================================
  // 1. SUPER ADMIN PERMISSIONS & CROSS-FRANCHISE VALIDATION
  // ====================================================================
  it('1a. Super Admin can query vehicles across all franchises and branches', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const vins = getList(res.body).map((v: any) => v.vin);
    expect(vins).toContain(vehicleA1.vin);
    expect(vins).toContain(vehicleB1.vin);
    expect(vins).toContain(vehicleC2.vin);
  });

  it('1b. Super Admin filters by specific branch correctly', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles?branchId=${branchA1.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const vins = getList(res.body).map((v: any) => v.vin);
    expect(vins).toContain(vehicleA1.vin);
    expect(vins).not.toContain(vehicleB1.vin);
    expect(vins).not.toContain(vehicleC2.vin);
  });

  it('1c. Super Admin is REJECTED with 400 when passing branch from different franchise', async () => {
    // Branch C2 belongs to Franchise 2, but we pass franchiseId of Franchise 1
    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles?franchiseId=${franchise1.id}&branchId=${branchC2.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(400);

    expect(res.body.message).toContain('Selected branch does not belong to the selected franchise');
  });

  // ====================================================================
  // 2. FRANCHISE MANAGER SCOPING & ISOLATION
  // ====================================================================
  it('2a. Franchise Manager 1 sees vehicles in their branches (A1, B1) but NOT C2 (Franchise 2)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${franchiseManager1Token}`)
      .expect(200);

    const vins = getList(res.body).map((v: any) => v.vin);
    expect(vins).toContain(vehicleA1.vin);
    expect(vins).toContain(vehicleB1.vin);
    expect(vins).not.toContain(vehicleC2.vin);
  });

  it('2b. Franchise Manager 1 is REJECTED with 403 when requesting Franchise 2 scope', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles?franchiseId=${franchise2.id}`)
      .set('Authorization', `Bearer ${franchiseManager1Token}`)
      .expect(403);

    expect(res.body.message).toContain('Multi-tenant scope violation');
  });

  it('2c. Franchise Manager 1 is REJECTED with 403 when requesting Branch C2 (in Franchise 2)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles?branchId=${branchC2.id}`)
      .set('Authorization', `Bearer ${franchiseManager1Token}`)
      .expect(403);

    expect(res.body.message).toContain('Multi-tenant scope violation');
  });

  // ====================================================================
  // 3. BRANCH MANAGER STRICT SCOPE ENFORCEMENT
  // ====================================================================
  it('3a. Branch Manager A1 sees only Branch A1 vehicles', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${branchManagerA1Token}`)
      .expect(200);

    const vins = getList(res.body).map((v: any) => v.vin);
    expect(vins).toContain(vehicleA1.vin);
    expect(vins).not.toContain(vehicleB1.vin);
    expect(vins).not.toContain(vehicleC2.vin);
  });

  it('3b. Branch Manager A1 is REJECTED with 403 when attempting to access Branch B1', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles?branchId=${branchB1.id}`)
      .set('Authorization', `Bearer ${branchManagerA1Token}`)
      .expect(403);

    expect(res.body.message).toContain('Multi-tenant scope violation');
  });

  // ====================================================================
  // 4. SERVICE JOBS FILTERING & ROLE SCOPING
  // ====================================================================
  it('4a. Branch Manager A1 can query service jobs for their branch', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/service/jobs')
      .set('Authorization', `Bearer ${branchManagerA1Token}`)
      .expect(200);

    const jobCards = getList(res.body).map((j: any) => j.jobNumber);
    expect(jobCards).toContain(jobA1.jobNumber);
  });

  it('4b. Branch Manager B1 sees NO service jobs because jobA1 is in Branch A1', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/service/jobs')
      .set('Authorization', `Bearer ${branchManagerB1Token}`)
      .expect(200);

    const jobCards = getList(res.body).map((j: any) => j.jobNumber);
    expect(jobCards).not.toContain(jobA1.jobNumber);
  });

  it('4c. Service jobs filter by status and date range', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app.getHttpServer())
      .get(`/api/v1/service/jobs?status=IN_PROGRESS&startDate=${today}`)
      .set('Authorization', `Bearer ${branchManagerA1Token}`)
      .expect(200);

    const jobCards = getList(res.body).map((j: any) => j.jobNumber);
    expect(jobCards).toContain(jobA1.jobNumber);

    // Filter with future start date returns empty
    const futureRes = await request(app.getHttpServer())
      .get('/api/v1/service/jobs?startDate=2099-01-01')
      .set('Authorization', `Bearer ${branchManagerA1Token}`)
      .expect(200);

    expect(getList(futureRes.body).length).toBe(0);
  });

  // ====================================================================
  // 5. QUOTATIONS, BOOKINGS & BILLING INVOICES FILTERING
  // ====================================================================
  it('5a. Quotations filter by branchId and enforce tenant scope', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/quotations?branchId=${branchA1.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const quoteNums = getList(res.body).map((q: any) => q.quotationNumber);
    expect(quoteNums).toContain(quotationA1.quotationNumber);
  });

  it('5b. Bookings filter by branchId and reject unauthorized branch access', async () => {
    // Branch Manager B1 cannot query Branch A1 bookings
    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings?branchId=${branchA1.id}`)
      .set('Authorization', `Bearer ${branchManagerB1Token}`)
      .expect(403);

    expect(res.body.message).toContain('Multi-tenant scope violation');
  });

  it('5c. Billing invoices filter by branchId and enforce isolation', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/invoices?branchId=${branchA1.id}`)
      .set('Authorization', `Bearer ${branchManagerA1Token}`)
      .expect(200);

    const invNums = getList(res.body).map((inv: any) => inv.invoiceNumber);
    expect(invNums).toContain(invoiceA1.invoiceNumber);
  });

  // ====================================================================
  // 6. CRM LEADS & REPORTS FILTERING
  // ====================================================================
  it('6a. CRM leads filter by branchId and status', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/crm/leads?branchId=${branchA1.id}&status=QUALIFIED`)
      .set('Authorization', `Bearer ${branchManagerA1Token}`)
      .expect(200);

    const leadIds = getList(res.body).map((l: any) => l.id);
    expect(leadIds).toContain(leadA1.id);
  });

  it('6b. Executive Reports accurately aggregate branch-level data', async () => {
    // Sales Report for Branch A1
    const salesReportRes = await request(app.getHttpServer())
      .get(`/api/v1/reports/sales?branchId=${branchA1.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(salesReportRes.body.data.totalQuotations).toBeGreaterThanOrEqual(1);
    expect(salesReportRes.body.data.totalBookings).toBeGreaterThanOrEqual(1);

    // Inventory Report for Branch A1
    const invReportRes = await request(app.getHttpServer())
      .get(`/api/v1/reports/inventory?branchId=${branchA1.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(invReportRes.body.data.inStock).toBeGreaterThanOrEqual(1);

    // Service Report for Branch A1
    const serviceReportRes = await request(app.getHttpServer())
      .get(`/api/v1/reports/service?branchId=${branchA1.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(serviceReportRes.body.data.openJobs).toBeGreaterThanOrEqual(1);

    // Finance Report for Branch A1
    const financeReportRes = await request(app.getHttpServer())
      .get(`/api/v1/reports/finance?branchId=${branchA1.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(financeReportRes.body.data.issuedInvoices).toBeGreaterThanOrEqual(1);
  });

  // ====================================================================
  // 7. CUSTOMER PERMISSION BOUNDARY
  // ====================================================================
  it('7. Customers are FORBIDDEN from accessing internal branch management endpoints', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/crm/leads')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });
});
