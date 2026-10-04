import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

jest.setTimeout(60000);

describe('Titan Auto Backend Phase 2 — Complete End-to-End Business Operations Workflow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let adminUserId: string;

  let franchiseId: string;
  let branchId: string;
  let employeeId: string;

  // Flow Data Identifiers
  let customerId: string;
  let leadId: string;
  let manufacturerId: string;
  let modelId: string;
  let variantId: string;
  let vehicleId: string;
  let quotationId: string;
  let bookingId: string;
  let paymentId: string;
  let financeAppId: string;
  let insurancePolicyId: string;
  let invoiceId: string;
  let pdiId: string;
  let deliveryId: string;

  const testVin = `VINPHASE2${Date.now()}`;
  const testEngine = `ENGPHASE2${Date.now()}`;

  beforeAll(async () => {
    jest.setTimeout(30000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['/health'] });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    try {
      const hashedPass = await bcrypt.hash('AdminSecret123!', 10);

    // Ensure Super Admin Role
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', rank: 1 },
    });

    // Create Franchise & Branch
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-P2-${Date.now()}`,
        name: 'Phase 2 Test Franchise',
        legalName: 'Phase 2 Franchise Private Limited',
        taxId: '27AAAAA0000A1Z5',
      },
    });
    franchiseId = franchise.id;

    const branch = await prisma.branch.create({
      data: {
        code: `BR-P2-${Date.now()}`,
        name: 'Phase 2 Main Branch',
        franchiseId,
        city: 'Mumbai',
        state: 'Maharashtra',
      },
    });
    branchId = branch.id;

    // Create User & Employee
    const adminUser = await prisma.user.create({
      data: {
        email: `p2admin-${Date.now()}@titanauto.com`,
        passwordHash: hashedPass,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = adminUser.id;

    const employee = await prisma.employee.create({
      data: {
        userId: adminUserId,
        branchId,
        employeeCode: `EMP-P2-${Date.now()}`,
        firstName: 'Phase2',
        lastName: 'Admin',
        status: 'ACTIVE',
      },
    });
    employeeId = employee.id;

    await prisma.employeeRoleAssignment.create({
      data: {
        employeeId,
        roleId: superAdminRole.id,
      },
    });

    // Login Admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: adminUser.email,
        password: 'AdminSecret123!',
      })
      .expect(200);

    adminToken = loginRes.body.accessToken || loginRes.body.data?.accessToken;
    } catch (e) {
      console.warn('Prisma DB setup skipped during offline testing');
      franchiseId = 'FR-DEV-01';
      branchId = 'BR-DEV-01';
      employeeId = 'emp-admin-01';
      adminUserId = 'usr-admin-01';

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@titanauto.com', password: 'password123' });
      adminToken = loginRes.body.data?.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Customer Management — Create Customer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Fleet Logistics Ltd',
        phone: '+919876543210',
        email: 'fleet@logistics.com',
        address: '45 Transport Nagar',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        gstin: '27AAAAA0000A1Z5',
        customerType: 'BUSINESS',
        companyName: 'Fleet Logistics Private Limited',
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    customerId = body.id;
  });

  it('2. CRM / Leads — Create & Assign Lead', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        franchiseId,
        branchId,
        assignedEmployeeId: employeeId,
        source: 'FIELD_VISIT',
        interestedModel: 'Prima 5530',
        expectedBudget: 5000000,
        priority: 'HIGH',
        notes: 'Customer needs 2 heavy duty commercial trucks for long haul',
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    leadId = body.id;
  });

  it('3. Truck Catalogue — Setup Manufacturer, Model & Variant', async () => {
    // Manufacturer
    const mfgRes = await request(app.getHttpServer())
      .post('/api/v1/manufacturers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Tata Motors P2 ${Date.now()}`, country: 'India' })
      .expect(201);
    manufacturerId = (mfgRes.body.data || mfgRes.body).id;

    // Model
    const modelRes = await request(app.getHttpServer())
      .post('/api/v1/truck-models')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        manufacturerId,
        name: 'Prima Heavy Duty Series',
        category: 'HAULAGE',
      })
      .expect(201);
    modelId = (modelRes.body.data || modelRes.body).id;

    // Variant
    const variantRes = await request(app.getHttpServer())
      .post('/api/v1/truck-variants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        modelId,
        name: 'Prima 5530.S Trailer',
        engineDetails: 'Cummins ISBe 6.7L BS6',
        horsepower: 300,
        fuelType: 'DIESEL',
        transmission: '9-Speed Manual',
        payload: 55000,
        basePrice: 4200000,
        gstRate: 28,
        description: 'Flagship heavy commercial tractor trailer',
      })
      .expect(201);
    variantId = (variantRes.body.data || variantRes.body).id;
  });

  it('4. Physical Vehicle Inventory — Add Physical Vehicle to Branch', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vin: testVin,
        engineNumber: testEngine,
        variantId,
        branchId,
        manufacturingYear: 2026,
        color: 'Arctic White',
        baseCost: 3800000,
        sellingPrice: 4200000,
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    expect(body.status).toBe('IN_STOCK');
    vehicleId = body.id;
  });

  it('5. Quotations — Create Quotation with Server Monetary Calculation', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/quotations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        leadId,
        franchiseId,
        branchId,
        salespersonEmployeeId: employeeId,
        variantId,
        quantity: 1,
        accessoriesAmount: 50000,
        insuranceAmount: 45000,
        registrationAmount: 35000,
        discountAmount: 10000,
        validityDate: '2026-12-31T00:00:00.000Z',
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    expect(Number(body.subtotal)).toBeGreaterThan(4000000);
    expect(Number(body.gstAmount)).toBeGreaterThan(1000000);
    quotationId = body.id;
  });

  it('6. Quotation Approval — Approve Quotation', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/quotations/${quotationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.status).toBe('APPROVED');
  });

  it('7. Bookings — Create Booking & Transactionally Reserve Vehicle', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        quotationId,
        vehicleId,
        branchId,
        salespersonEmployeeId: employeeId,
        bookingAmount: 500000,
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    expect(body.status).toBe('PENDING');
    bookingId = body.id;

    // Verify Vehicle status is now RESERVED
    const vehRes = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect((vehRes.body.data || vehRes.body).status).toBe('RESERVED');
  });

  it('8. Payments — Create Payment Order & Verify Server-Side', async () => {
    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookingId,
        amount: 500000,
        gateway: 'RAZORPAY',
        idempotencyKey: `IDEM-PAY-${Date.now()}`,
      })
      .expect(201);

    paymentId = (orderRes.body.data || orderRes.body).id;

    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paymentId,
        gatewayPaymentId: `PAY_RZP_${Date.now()}`,
        signature: 'valid_gateway_signature',
      })
      .expect(201);

    expect((verifyRes.body.data || verifyRes.body).status).toBe('SUCCESS');

    // Check Booking Status updated to CONFIRMED
    const bkRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect((bkRes.body.data || bkRes.body).status).toBe('CONFIRMED');
  });

  it('9. Finance Application — Submit Finance Application', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/finance/applications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        bookingId,
        financeProvider: 'HDFC Commercial Vehicle Finance',
        loanAmount: 4000000,
        downPayment: 1000000,
        tenureMonths: 60,
        interestRate: 8.9,
      })
      .expect(201);

    financeAppId = (res.body.data || res.body).id;
    expect(financeAppId).toBeDefined();
  });

  it('10. Insurance Policy — Create Insurance Policy', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/insurance/policies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        bookingId,
        insurer: 'ICICI Lombard General Insurance',
        policyType: 'COMPREHENSIVE_COMMERCIAL',
        premium: 45000,
        startDate: '2026-10-01T00:00:00.000Z',
        expiryDate: '2027-09-30T00:00:00.000Z',
      })
      .expect(201);

    insurancePolicyId = (res.body.data || res.body).id;
    expect(insurancePolicyId).toBeDefined();
  });

  it('11. Vehicle Allocation — Allocate Reserved Vehicle', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${vehicleId}/allocate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bookingId })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.status).toBe('ALLOCATED');
  });

  it('12. PDI Inspection — Perform & Pass PDI Inspection', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${vehicleId}/pdi`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookingId,
        checklist: {
          exterior: 'OK',
          tyres: 'OK',
          engine: 'OK',
          brakes: 'OK',
          lights: 'OK',
          electrical: 'OK',
          documents: 'OK',
        },
        status: 'PASSED',
        remarks: 'PDI Complete. Vehicle ready for customer delivery.',
      })
      .expect(201);

    pdiId = (res.body.data || res.body).id;
    expect(pdiId).toBeDefined();

    // Verify Vehicle status is PDI_COMPLETED
    const vehRes = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect((vehRes.body.data || vehRes.body).status).toBe('PDI_COMPLETED');
  });

  it('13. GST Billing / Invoices — Issue GST Invoice', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        bookingId,
        vehicleId,
        franchiseId,
        branchId,
        billingAddress: '45 Transport Nagar, Mumbai, Maharashtra',
        gstin: '27AAAAA0000A1Z5',
        isInterState: false,
        items: [
          {
            description: 'Tata Prima 5530 Heavy Duty Tractor Trailer',
            quantity: 1,
            unitPrice: 4200000,
            gstRate: 28,
          },
        ],
      })
      .expect(201);

    invoiceId = (res.body.data || res.body).id;
    expect(invoiceId).toBeDefined();
    expect(Number((res.body.data || res.body).totalAmount)).toBeGreaterThan(5000000);
  });

  it('14. Vehicle Delivery — Handover Vehicle to Customer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/deliveries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        vehicleId,
        bookingId,
        invoiceId,
        deliveryEmployeeId: employeeId,
        deliveryLocation: 'Titan Auto Branch Yard, Mumbai',
        odometerReading: 12.5,
        customerAcknowledgement: true,
      })
      .expect(201);

    deliveryId = (res.body.data || res.body).id;
    expect(deliveryId).toBeDefined();

    // Verify Vehicle status is DELIVERED and owned by Customer
    const vehRes = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const vehicleData = vehRes.body.data || vehRes.body;
    expect(vehicleData.status).toBe('DELIVERED');
    expect(vehicleData.customerId).toBe(customerId);
  });
});
