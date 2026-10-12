import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

jest.setTimeout(60000);

describe('Phase 4 — Physical Vehicle Inventory, Allocation, PDI & Delivery Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testPassword = 'ActualSecurePassword123!';
  const ts = Date.now();

  let branchAId: string;
  let branchBId: string;
  let franchiseId: string;

  let variantAId: string;
  let variantBId: string;

  let superAdminToken: string;
  let branchManagerAToken: string;
  let branchManagerAId: string;
  let branchManagerBToken: string;
  let branchManagerBId: string;

  let customerUser: any;
  let customerId: string;
  let customerToken: string;

  let customerBUser: any;
  let customerBId: string;
  let customerBToken: string;

  let createdVehicleAId: string;
  let createdVehicleAVin: string;

  let bookingAId: string;
  let bookingBId: string;
  let invoiceAId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const passwordHash = await bcrypt.hash(testPassword, 10);

    // 1. Setup Roles
    const bmRole = await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: {},
      create: { name: 'BRANCH_MANAGER', description: 'Branch Operations Head' },
    });
    const saRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', description: 'Global Super Administrator' },
    });

    // 2. Setup Franchise and Branches
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-P4-${ts}`,
        name: `Ashok Leyland Rajasthan P4 ${ts}`,
        status: 'ACTIVE',
      },
    });
    franchiseId = franchise.id;

    const branchA = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-P4-A-${ts}`,
        name: `Jaipur Fleet Hub P4 ${ts}`,
        city: 'Jaipur',
        status: 'ACTIVE',
      },
    });
    branchAId = branchA.id;

    const branchB = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-P4-B-${ts}`,
        name: `Kota Fleet Hub P4 ${ts}`,
        city: 'Kota',
        status: 'ACTIVE',
      },
    });
    branchBId = branchB.id;

    // 3. Setup Super Admin
    const saUser = await prisma.user.create({
      data: {
        email: `superadmin-p4-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    await prisma.employee.create({
      data: {
        userId: saUser.id,
        branchId: branchAId,
        employeeCode: `EMP-SA-P4-${ts}`,
        firstName: 'Global',
        lastName: 'SuperAdmin',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: saRole.id } },
      },
    });

    // 4. Setup Branch Manager A
    const bmAUser = await prisma.user.create({
      data: {
        email: `bma-p4-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    const bmAEmployee = await prisma.employee.create({
      data: {
        userId: bmAUser.id,
        branchId: branchAId,
        employeeCode: `EMP-BMA-P4-${ts}`,
        firstName: 'Manager',
        lastName: 'Alpha',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });
    branchManagerAId = bmAEmployee.id;

    // 5. Setup Branch Manager B
    const bmBUser = await prisma.user.create({
      data: {
        email: `bmb-p4-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    const bmBEmployee = await prisma.employee.create({
      data: {
        userId: bmBUser.id,
        branchId: branchBId,
        employeeCode: `EMP-BMB-P4-${ts}`,
        firstName: 'Manager',
        lastName: 'Beta',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });
    branchManagerBId = bmBEmployee.id;

    // 6. Setup Customers
    customerUser = await prisma.user.create({
      data: {
        email: `customera-p4-${ts}@example.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    const cust = await prisma.customer.create({
      data: {
        userId: customerUser.id,
        name: `Fleet Operator Alpha ${ts}`,
        email: customerUser.email,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
      },
    });
    customerId = cust.id;

    customerBUser = await prisma.user.create({
      data: {
        email: `customerb-p4-${ts}@example.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    const custB = await prisma.customer.create({
      data: {
        userId: customerBUser.id,
        name: `Independent Carrier Beta ${ts}`,
        email: customerBUser.email,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
      },
    });
    customerBId = custB.id;

    // 7. Setup Catalogue
    const mfg = await prisma.manufacturer.create({
      data: { name: `Ashok Leyland P4 ${ts}`, country: 'India' },
    });
    const model = await prisma.truckModel.create({
      data: { manufacturerId: mfg.id, name: `AVTR 4825.T P4 ${ts}`, category: 'HAULAGE' },
    });
    const variantA = await prisma.truckVariant.create({
      data: {
        modelId: model.id,
        name: `AVTR 4825 Heavy Duty ${ts}`,
        basePrice: 4500000,
        gstRate: 28,
        status: 'ACTIVE',
      },
    });
    variantAId = variantA.id;

    const variantB = await prisma.truckVariant.create({
      data: {
        modelId: model.id,
        name: `AVTR 5525 Tractor Trailer ${ts}`,
        basePrice: 5200000,
        gstRate: 28,
        status: 'ACTIVE',
      },
    });
    variantBId = variantB.id;

    // Login users to acquire tokens
    const saLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: saUser.email, password: testPassword });
    superAdminToken = saLogin.body.data?.accessToken || saLogin.body.accessToken;

    const bmaLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: bmAUser.email, password: testPassword });
    branchManagerAToken = bmaLogin.body.data?.accessToken || bmaLogin.body.accessToken;

    const bmbLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: bmBUser.email, password: testPassword });
    branchManagerBToken = bmbLogin.body.data?.accessToken || bmbLogin.body.accessToken;

    const custLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: customerUser.email, password: testPassword });
    customerToken = custLogin.body.data?.accessToken || custLogin.body.accessToken;

    const custBLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: customerBUser.email, password: testPassword });
    customerBToken = custBLogin.body.data?.accessToken || custBLogin.body.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Create Vehicle & Uniqueness Validation
  it('1. Create vehicle: Persists physical inventory uniquely and enforces VIN/engine number uniqueness', async () => {
    createdVehicleAVin = `MB1T${ts}AL4825001`;
    const engineNumber = `ENG-AL-${ts}-01`;

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        vin: createdVehicleAVin,
        engineNumber,
        branchId: branchAId,
        variantId: variantAId,
        manufacturingYear: 2026,
        color: 'Speed White',
        baseCost: 4000000,
        sellingPrice: 4500000,
      });

    expect(createRes.status).toBe(201);
    const vehicle = createRes.body.data || createRes.body;
    expect(vehicle.id).toBeDefined();
    expect(vehicle.vin).toBe(createdVehicleAVin);
    expect(vehicle.status).toBe('IN_STOCK');
    createdVehicleAId = vehicle.id;

    // Verify duplicate VIN fails with 409 Conflict
    const dupVinRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        vin: createdVehicleAVin,
        engineNumber: `ENG-AL-${ts}-02`,
        branchId: branchAId,
        variantId: variantAId,
        manufacturingYear: 2026,
        baseCost: 4000000,
        sellingPrice: 4500000,
      });
    expect(dupVinRes.status).toBe(409);

    // Verify duplicate engine number fails with 409 Conflict
    const dupEngRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        vin: `MB1T${ts}AL4825002`,
        engineNumber,
        branchId: branchAId,
        variantId: variantAId,
        manufacturingYear: 2026,
        baseCost: 4000000,
        sellingPrice: 4500000,
      });
    expect(dupEngRes.status).toBe(409);
  });

  // TEST 2: Invalid Branch Rejection
  it('2. Invalid branch: Rejects creation when branch is non-existent or invalid without falling back', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        vin: `MB1T${ts}INVBR001`,
        engineNumber: `ENG-${ts}-INVBR001`,
        branchId: '00000000-0000-0000-0000-000000000000',
        variantId: variantAId,
        manufacturingYear: 2026,
        baseCost: 3500000,
        sellingPrice: 4000000,
      });

    expect([400, 404]).toContain(res.status);
  });

  // TEST 3: Invalid Variant Rejection
  it('3. Invalid variant: Rejects creation when truck variant does not exist without silent fallback', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        vin: `MB1T${ts}INVVAR001`,
        engineNumber: `ENG-${ts}-INVVAR001`,
        branchId: branchAId,
        variantId: '00000000-0000-0000-0000-000000000000',
        manufacturingYear: 2026,
        baseCost: 3500000,
        sellingPrice: 4000000,
      });

    expect([400, 404]).toContain(res.status);
  });

  // TEST 4: Branch Isolation
  it('4. Branch isolation: Branch Manager cannot add or operate on vehicles in another branch', async () => {
    // A. BM-A tries to add vehicle to Branch B -> 403 Forbidden
    const crossCreate = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        vin: `MB1T${ts}CROSS001`,
        engineNumber: `ENG-${ts}-CROSS001`,
        branchId: branchBId,
        variantId: variantAId,
        manufacturingYear: 2026,
        baseCost: 3500000,
        sellingPrice: 4000000,
      });
    expect(crossCreate.status).toBe(403);

    // Create a vehicle in Branch B using BM-B
    const bmBVehicleRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${branchManagerBToken}`)
      .send({
        vin: `MB1T${ts}BRB001`,
        engineNumber: `ENG-${ts}-BRB001`,
        branchId: branchBId,
        variantId: variantBId,
        manufacturingYear: 2026,
        baseCost: 4200000,
        sellingPrice: 4800000,
      });
    expect(bmBVehicleRes.status).toBe(201);
    const vehicleB = bmBVehicleRes.body.data || bmBVehicleRes.body;

    // B. BM-A tries to read vehicle in Branch B -> 403 Forbidden
    const crossRead = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleB.id}`)
      .set('Authorization', `Bearer ${branchManagerAToken}`);
    expect(crossRead.status).toBe(403);

    // C. BM-A tries to query vehicles with branchId of Branch B -> 403 Forbidden
    const crossList = await request(app.getHttpServer())
      .get(`/api/v1/vehicles?branchId=${branchBId}`)
      .set('Authorization', `Bearer ${branchManagerAToken}`);
    expect(crossList.status).toBe(403);
  });

  // TEST 5: Vehicle Allocation (Quotation -> Booking -> Allocation)
  it('5. Vehicle allocation: Allocates physical vehicle to booking and validates branch/variant match', async () => {
    // Step 1: Customer creates quotation
    const quoteRes = await request(app.getHttpServer())
      .post('/api/v1/quotations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        branchId: branchAId,
        variantId: variantAId,
        quantity: 1,
        accessoriesAmount: 50000,
        insuranceAmount: 120000,
        validityDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
    expect(quoteRes.status).toBe(201);
    const quotation = quoteRes.body.data || quoteRes.body;

    // Step 2: Customer creates booking
    const bookRes = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        quotationId: quotation.id,
        bookingAmount: 100000,
        branchId: branchAId,
      });
    expect(bookRes.status).toBe(201);
    const booking = bookRes.body.data || bookRes.body;
    bookingAId = booking.id;

    // Step 3: BM-A allocates Vehicle A to Booking A
    const allocRes = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${createdVehicleAId}/allocate`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({ bookingId: bookingAId });

    expect(allocRes.status).toBe(201);
    const alloc = allocRes.body.data || allocRes.body;
    expect(alloc.status).toBe('ALLOCATED');

    // Verify vehicle status in DB transitioned to ALLOCATED
    const updatedVehicle = await prisma.vehicle.findUnique({ where: { id: createdVehicleAId } });
    expect(updatedVehicle?.status).toBe('ALLOCATED');

    // Verify booking updated to CONFIRMED and vehicleId linked
    const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingAId } });
    expect(updatedBooking?.status).toBe('CONFIRMED');
    expect(updatedBooking?.vehicleId).toBe(createdVehicleAId);
  });

  // TEST 6: Double Allocation Prevention
  it('6. Double allocation prevention: Rejects second allocation of already allocated vehicle via transactional row locking', async () => {
    // Create another quotation and booking in Branch A
    const qRes = await request(app.getHttpServer())
      .post('/api/v1/quotations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        branchId: branchAId,
        variantId: variantAId,
        quantity: 1,
        validityDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
    const quote = qRes.body.data || qRes.body;

    const bRes = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        quotationId: quote.id,
        bookingAmount: 50000,
        branchId: branchAId,
      });
    const booking2 = bRes.body.data || bRes.body;
    bookingBId = booking2.id;

    // Attempt to allocate createdVehicleAId again (currently ALLOCATED)
    const secondAllocRes = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${createdVehicleAId}/allocate`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({ bookingId: bookingBId });

    // Must be rejected with 409 Conflict
    expect(secondAllocRes.status).toBe(409);
  });

  // TEST 7: Mandatory PDI Requirement
  it('7. PDI requirement: Delivery is blocked until vehicle completes and passes mandatory PDI inspection', async () => {
    // Create an invoice linked to Booking A
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-P4-${ts}`,
        customerId,
        vehicleId: createdVehicleAId,
        bookingId: bookingAId,
        franchiseId,
        branchId: branchAId,
        billingAddress: 'Jaipur Transport Hub, Yard 4',
        subtotal: 4500000,
        taxableAmount: 4500000,
        totalAmount: 5760000,
        status: 'ISSUED',
        paymentStatus: 'PAID',
      },
    });
    invoiceAId = invoice.id;

    // Step A: Attempt delivery without PDI -> Blocked with 400 Bad Request
    const prematureDelivery = await request(app.getHttpServer())
      .post('/api/v1/deliveries')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        customerId,
        vehicleId: createdVehicleAId,
        bookingId: bookingAId,
        invoiceId: invoiceAId,
        deliveryLocation: 'Jaipur Delivery Center',
      });

    expect(prematureDelivery.status).toBe(400);
    expect(prematureDelivery.body.message).toContain('PDI inspection');

    // Step B: Conduct PDI and pass it
    const pdiRes = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${createdVehicleAId}/pdi`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        checklist: {
          engine: 'OK',
          brakes: 'OK',
          tyres: 'OK',
          electrical: 'OK',
          fluids: 'OK',
          bodywork: 'EXCELLENT',
        },
        status: 'PASSED',
        remarks: 'All 50 safety checklist items verified and passed certification',
      });

    expect(pdiRes.status).toBe(201);

    // Verify vehicle transitioned to PDI_COMPLETED
    const pdiVehicle = await prisma.vehicle.findUnique({ where: { id: createdVehicleAId } });
    expect(pdiVehicle?.status).toBe('PDI_COMPLETED');
  });

  // TEST 8: Successful Delivery Execution
  it('8. Delivery: Completes vehicle handover, marks vehicle DELIVERED, and updates booking to CONVERTED_TO_DELIVERY', async () => {
    const deliveryRes = await request(app.getHttpServer())
      .post('/api/v1/deliveries')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        customerId,
        vehicleId: createdVehicleAId,
        bookingId: bookingAId,
        invoiceId: invoiceAId,
        deliveryLocation: 'Jaipur Fleet Delivery Center',
        odometerReading: 12.4,
        customerAcknowledgement: true,
      });

    expect(deliveryRes.status).toBe(201);
    const delivery = deliveryRes.body.data || deliveryRes.body;
    expect(delivery.id).toBeDefined();
    expect(delivery.deliveryNumber).toMatch(/^DEL-/);
    expect(delivery.status).toBe('COMPLETED');

    // Verify vehicle in database is DELIVERED and owned by customer
    const deliveredVehicle = await prisma.vehicle.findUnique({ where: { id: createdVehicleAId } });
    expect(deliveredVehicle?.status).toBe('DELIVERED');
    expect(deliveredVehicle?.customerId).toBe(customerId);

    // Verify booking in database is CONVERTED_TO_DELIVERY
    const completedBooking = await prisma.booking.findUnique({ where: { id: bookingAId } });
    expect(completedBooking?.status).toBe('CONVERTED_TO_DELIVERY');
  });

  // TEST 9: Customer Ownership Visibility
  it('9. Customer ownership: Customer sees delivered vehicle in their owned vehicles, but cannot see dealership inventory', async () => {
    // Customer A queries their own customer record -> Sees their delivered vehicle
    const custRes = await request(app.getHttpServer())
      .get(`/api/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(custRes.status).toBe(200);
    const custData = custRes.body.data || custRes.body;
    expect(custData.vehicles).toBeDefined();
    const vehicleIds = (custData.vehicles || []).map((v: any) => v.id);
    expect(vehicleIds).toContain(createdVehicleAId);

    // Customer A is strictly forbidden from querying dealership-wide physical vehicle inventory
    const dealerInventoryRes = await request(app.getHttpServer())
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(dealerInventoryRes.status).toBe(403);

    // Customer B attempts to view Customer A's customer record & vehicles -> 403 Forbidden
    const crossAccessCustRes = await request(app.getHttpServer())
      .get(`/api/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${customerBToken}`);
    expect(crossAccessCustRes.status).toBe(403);
  });

  // TEST 10: Vehicle Status History
  it('10. Vehicle status history: Provides full timeline of allocations, PDI inspections, deliveries and status audits', async () => {
    const historyRes = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${createdVehicleAId}/history`)
      .set('Authorization', `Bearer ${branchManagerAToken}`);

    expect(historyRes.status).toBe(200);
    const history = historyRes.body.data || historyRes.body;

    expect(history.vehicleId).toBe(createdVehicleAId);
    expect(history.currentStatus).toBe('DELIVERED');

    // Verify allocations are recorded
    expect(history.allocations.length).toBeGreaterThanOrEqual(1);
    expect(history.allocations[0].bookingId).toBe(bookingAId);

    // Verify PDI inspections are recorded
    expect(history.pdiInspections.length).toBeGreaterThanOrEqual(1);
    expect(history.pdiInspections[0].status).toBe('PASSED');

    // Verify delivery is recorded
    expect(history.deliveries.length).toBeGreaterThanOrEqual(1);
    expect(history.deliveries[0].customerId).toBe(customerId);

    // Verify status audit logs exist
    expect(history.auditLogs.length).toBeGreaterThanOrEqual(1);
  });
});
