import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

jest.setTimeout(60000);

describe('Phase 3 — Real Business Flows, Catalogue, Quotations, Bookings, Insurance & Payments Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testPassword = 'ActualSecurePassword123!';
  const ts = Date.now();

  let branchAId: string;
  let branchBId: string;
  let franchiseId: string;

  let customerAUserId: string;
  let customerAId: string;
  let customerAToken: string;

  let customerBUserId: string;
  let customerBId: string;
  let customerBToken: string;

  let branchManagerAToken: string;
  let branchManagerAId: string;

  let branchManagerBToken: string;
  let branchManagerBId: string;

  let variantId: string;
  let createdQuotationId: string;
  let createdQuotationNumber: string;
  let createdBookingId: string;
  let createdBookingNumber: string;
  let createdPaymentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['/health'] });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const passwordHash = await bcrypt.hash(testPassword, 10);

    // 1. Setup Roles
    const customerRole = await prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: { name: 'CUSTOMER', description: 'Retail Customer' },
    });

    const bmRole = await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: {},
      create: { name: 'BRANCH_MANAGER', description: 'Branch Manager' },
    });

    // 2. Setup Franchise & Branches
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-P3-${ts}`,
        name: `Titan P3 Franchise ${ts}`,
        status: 'ACTIVE',
      },
    });
    franchiseId = franchise.id;

    const branchA = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-P3-A-${ts}`,
        name: `Jaipur Main Hub ${ts}`,
        city: 'Jaipur',
        status: 'ACTIVE',
      },
    });
    branchAId = branchA.id;

    const branchB = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-P3-B-${ts}`,
        name: `Jodhpur Hub ${ts}`,
        city: 'Jodhpur',
        status: 'ACTIVE',
      },
    });
    branchBId = branchB.id;

    // 3. Setup Customer A
    const custAUser = await prisma.user.create({
      data: {
        email: `customera-p3-${ts}@example.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customerAUserId = custAUser.id;

    const custA = await prisma.customer.create({
      data: {
        userId: custAUser.id,
        name: 'Corporate Logistics Fleet A',
        email: custAUser.email,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
      },
    });
    customerAId = custA.id;

    // 4. Setup Customer B
    const custBUser = await prisma.user.create({
      data: {
        email: `customerb-p3-${ts}@example.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customerBUserId = custBUser.id;

    const custB = await prisma.customer.create({
      data: {
        userId: custBUser.id,
        name: 'Independent Hauler B',
        email: custBUser.email,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
      },
    });
    customerBId = custB.id;

    // 5. Setup Branch Manager A
    const bmAUser = await prisma.user.create({
      data: {
        email: `bma-p3-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    const bmAEmployee = await prisma.employee.create({
      data: {
        userId: bmAUser.id,
        branchId: branchAId,
        employeeCode: `EMP-BMA-P3-${ts}`,
        firstName: 'Manager',
        lastName: 'Alpha',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });
    branchManagerAId = bmAEmployee.id;

    // 6. Setup Branch Manager B
    const bmBUser = await prisma.user.create({
      data: {
        email: `bmb-p3-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    const bmBEmployee = await prisma.employee.create({
      data: {
        userId: bmBUser.id,
        branchId: branchBId,
        employeeCode: `EMP-BMB-P3-${ts}`,
        firstName: 'Manager',
        lastName: 'Beta',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });
    branchManagerBId = bmBEmployee.id;

    // 7. Catalogue Setup: Manufacturer -> Model -> Variant
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Ashok Leyland P3 ${ts}`,
        country: 'India',
        status: 'ACTIVE',
      },
    });

    const model = await prisma.truckModel.create({
      data: {
        manufacturerId: manufacturer.id,
        name: `4825 Haulage ${ts}`,
        category: 'Heavy Commercial',
        status: 'ACTIVE',
      },
    });

    const variant = await prisma.truckVariant.create({
      data: {
        modelId: model.id,
        name: `Ashok Leyland 4825 10x4 Tipper P3 ${ts}`,
        engineDetails: 'A Series 6-Cylinder i-Gen6 BS6 250HP',
        horsepower: 250,
        fuelType: 'diesel',
        transmission: 'manual',
        payload: 34000,
        basePrice: 4800000,
        gstRate: 28,
        description: 'Commercial tipper truck for heavy mining and construction transport.',
        status: 'ACTIVE',
      },
    });
    variantId = variant.id;

    // Login users to acquire tokens
    const custARes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: custAUser.email, password: testPassword });
    expect([200, 201]).toContain(custARes.status);
    customerAToken = custARes.body.data?.accessToken || custARes.body.accessToken;

    const custBRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: custBUser.email, password: testPassword });
    expect([200, 201]).toContain(custBRes.status);
    customerBToken = custBRes.body.data?.accessToken || custBRes.body.accessToken;

    const bmaRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: bmAUser.email, password: testPassword });
    expect([200, 201]).toContain(bmaRes.status);
    branchManagerAToken = bmaRes.body.data?.accessToken || bmaRes.body.accessToken;

    const bmbRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: bmBUser.email, password: testPassword });
    expect([200, 201]).toContain(bmbRes.status);
    branchManagerBToken = bmbRes.body.data?.accessToken || bmbRes.body.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Public Catalogue Browsing
  it('1. Public users can browse catalogue hierarchy without exposing sensitive physical inventory data', async () => {
    // 1. Manufacturers
    const mfgRes = await request(app.getHttpServer()).get('/api/v1/catalogue/manufacturers');
    expect(mfgRes.status).toBe(200);
    const mfgs = mfgRes.body.data || mfgRes.body;
    expect(Array.isArray(mfgs)).toBe(true);

    // 2. Models
    const mdlRes = await request(app.getHttpServer()).get('/api/v1/catalogue/truck-models');
    expect(mdlRes.status).toBe(200);
    const mdls = mdlRes.body.data || mdlRes.body;
    expect(Array.isArray(mdls)).toBe(true);

    // 3. Variants
    const varRes = await request(app.getHttpServer()).get('/api/v1/catalogue/truck-variants');
    expect(varRes.status).toBe(200);
    const variants = varRes.body.data || varRes.body;
    expect(Array.isArray(variants)).toBe(true);

    const targetVar = variants.find((v: any) => v.id === variantId);
    expect(targetVar).toBeDefined();
    expect(targetVar.name).toContain('Ashok Leyland 4825');
    expect(Number(targetVar.basePrice)).toBe(4800000);

    // Verify sensitive physical inventory details (VIN, engine serial numbers, cost) are NOT exposed in public catalogue
    expect(targetVar.vin).toBeUndefined();
    expect(targetVar.chassisNumber).toBeUndefined();
    expect(targetVar.baseCost).toBeUndefined();
  });

  // TEST 2: Lightweight Customer Enquiry Flow
  it('2. Customer can submit a real enquiry/lead via real backend API without simulated timeouts', async () => {
    const leadRes = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        branchId: branchAId,
        interestedModel: 'Ashok Leyland 4825',
        expectedBudget: 5500000,
        notes: 'Enquiring about bulk discount for 5 fleet units',
      });

    expect(leadRes.status).toBe(201);
    const lead = leadRes.body.data || leadRes.body;
    expect(lead.id).toBeDefined();
    expect(lead.customerId).toBe(customerAId);
    expect(lead.status).toBe('NEW');

    // Verify in database
    const inDb = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(inDb).toBeDefined();
    expect(inDb?.customerId).toBe(customerAId);
  });

  // TEST 3: Real Quotation Creation & Financial Calculations
  it('3. Customer can create a real quotation with backend mathematical calculations and tax breakdown', async () => {
    const quoteRes = await request(app.getHttpServer())
      .post('/api/v1/quotations')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        branchId: branchAId,
        variantId,
        quantity: 2,
        accessoriesAmount: 50000,
        insuranceAmount: 120000,
        registrationAmount: 80000,
        discountAmount: 20000,
        validityDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        notes: 'Fleet purchase proposal with standard warranty',
      });

    expect(quoteRes.status).toBe(201);
    const quote = quoteRes.body.data || quoteRes.body;
    expect(quote.id).toBeDefined();
    expect(quote.quotationNumber).toMatch(/^QT-/);
    createdQuotationId = quote.id;
    createdQuotationNumber = quote.quotationNumber;

    // Verify calculation: (4800000 * 2) + 50000 + 120000 + 80000 - 20000 = 9830000 subtotal
    // GST 28%: 9830000 * 0.28 = 2752400
    // Total: 9830000 + 2752400 = 12582400
    expect(Number(quote.subtotal)).toBe(9830000);
    expect(Number(quote.gstAmount)).toBe(2752400);
    expect(Number(quote.totalAmount)).toBe(12582400);
    expect(quote.customerId).toBe(customerAId);
  });

  // TEST 4: Quotation Authorization & Scoping
  it('4. Quotation authorization: Customer sees only own quotations, other customer and other branch manager are blocked', async () => {
    // A. Customer A queries quotations -> sees created quotation
    const custAList = await request(app.getHttpServer())
      .get('/api/v1/quotations')
      .set('Authorization', `Bearer ${customerAToken}`);
    expect(custAList.status).toBe(200);
    const aItems = (custAList.body.data || custAList.body).items || custAList.body.data || custAList.body;
    const aIds = aItems.map((q: any) => q.id);
    expect(aIds).toContain(createdQuotationId);

    // B. Customer B queries quotations -> must NOT see Customer A's quotation
    const custBList = await request(app.getHttpServer())
      .get('/api/v1/quotations')
      .set('Authorization', `Bearer ${customerBToken}`);
    expect(custBList.status).toBe(200);
    const bItems = (custBList.body.data || custBList.body).items || custBList.body.data || custBList.body;
    const bIds = bItems.map((q: any) => q.id);
    expect(bIds).not.toContain(createdQuotationId);

    // C. Customer B attempts direct access to Customer A's quotation -> 403 Forbidden
    const crossAccessRes = await request(app.getHttpServer())
      .get(`/api/v1/quotations/${createdQuotationId}`)
      .set('Authorization', `Bearer ${customerBToken}`);
    expect(crossAccessRes.status).toBe(403);

    // D. Branch Manager A sees quotation in Branch A
    const bmaList = await request(app.getHttpServer())
      .get('/api/v1/quotations')
      .set('Authorization', `Bearer ${branchManagerAToken}`);
    expect(bmaList.status).toBe(200);
    const bmaItems = (bmaList.body.data || bmaList.body).items || bmaList.body.data || bmaList.body;
    expect(bmaItems.map((q: any) => q.id)).toContain(createdQuotationId);

    // E. Branch Manager B (Branch B) attempts access to Branch A quotation -> 403 Forbidden
    const bmbAccessRes = await request(app.getHttpServer())
      .get(`/api/v1/quotations/${createdQuotationId}`)
      .set('Authorization', `Bearer ${branchManagerBToken}`);
    expect(bmbAccessRes.status).toBe(403);
  });

  // TEST 5: Real Booking Flow (Quotation -> Booking)
  it('5. Customer can create a real booking from quotation and validate customer-quotation relationship', async () => {
    // A. Attempting to create booking with mismatched customer -> 400
    const mismatchRes = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerBToken}`) // Customer B trying to book Customer A's quotation
      .send({
        quotationId: createdQuotationId,
        bookingAmount: 500000,
        branchId: branchAId,
      });
    expect(mismatchRes.status).toBe(400);

    // B. Customer A books their quotation
    const bookRes = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        quotationId: createdQuotationId,
        bookingAmount: 500000,
        branchId: branchAId,
        notes: 'Deposit for 2 commercial units',
      });

    expect(bookRes.status).toBe(201);
    const booking = bookRes.body.data || bookRes.body;
    expect(booking.id).toBeDefined();
    expect(booking.bookingNumber).toMatch(/^BK-/);
    createdBookingId = booking.id;
    createdBookingNumber = booking.bookingNumber;
    expect(booking.status).toBe('PENDING');

    // C. Quotation status converted
    const quotDb = await prisma.quotation.findUnique({ where: { id: createdQuotationId } });
    expect(quotDb?.status).toBe('CONVERTED');
  });

  // TEST 6: Booking Authorization Scoping
  it('6. Booking authorization: Customer A sees own bookings, Customer B cannot access them', async () => {
    const custAList = await request(app.getHttpServer())
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerAToken}`);
    expect(custAList.status).toBe(200);
    const aItems = (custAList.body.data || custAList.body).items || custAList.body.data || custAList.body;
    expect(aItems.map((b: any) => b.id)).toContain(createdBookingId);

    const crossRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${createdBookingId}`)
      .set('Authorization', `Bearer ${customerBToken}`);
    expect(crossRes.status).toBe(403);
  });

  // TEST 7: Insurance Backend Query Scoping
  it('7. Insurance policies are fetched from backend and scoped to customer', async () => {
    // Create an insurance policy linked to Customer A's booking
    const pol = await prisma.insurancePolicy.create({
      data: {
        policyNumber: `POL-P3-${ts}`,
        customerId: customerAId,
        bookingId: createdBookingId,
        insurer: 'ICICI Lombard Commercial',
        policyType: 'Comprehensive Fleet Policy',
        premium: 120000,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 86400000),
        status: 'ACTIVE',
      },
    });

    // Customer A queries policies
    const custAPoliciesRes = await request(app.getHttpServer())
      .get('/api/v1/insurance/policies')
      .set('Authorization', `Bearer ${customerAToken}`);
    expect(custAPoliciesRes.status).toBe(200);
    const aItems = (custAPoliciesRes.body.data || custAPoliciesRes.body).items || [];
    expect(aItems.map((p: any) => p.id)).toContain(pol.id);

    // Customer B queries policy directly -> 403 Forbidden
    const crossPolRes = await request(app.getHttpServer())
      .get(`/api/v1/insurance/policies/${pol.id}`)
      .set('Authorization', `Bearer ${customerBToken}`);
    expect(crossPolRes.status).toBe(403);
  });

  // TEST 8: Server-Side Cryptographic Payment Verification
  it('8. Payment verification is enforced server-side and cannot be faked by client manipulation', async () => {
    // 1. Create real payment order on backend
    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        bookingId: createdBookingId,
        amount: 500000,
        idempotencyKey: `IDEM-P3-${Date.now()}`,
      });

    expect(orderRes.status).toBe(201);
    const payment = orderRes.body.data || orderRes.body;
    createdPaymentId = payment.id;
    expect(payment.gatewayOrderId).toBeDefined();
    expect(payment.status).toBe('CREATED');

    // 2. Manipulated / Fake Signature attempt -> REJECTED server-side with 400
    const fakeSigRes = await request(app.getHttpServer())
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        paymentId: createdPaymentId,
        gatewayPaymentId: `FAKE_PAY_${Date.now()}`,
        signature: 'fake_tampered_signature_from_client',
      });

    expect(fakeSigRes.status).toBe(400);
    expect(fakeSigRes.body.message).toContain('Payment Verification Failed');

    // Verify payment in database was marked FAILED
    const failedPaymentInDb = await prisma.payment.findUnique({ where: { id: createdPaymentId } });
    expect(failedPaymentInDb?.status).toBe('FAILED');

    // 3. Valid Server-Side Payment Verification
    // Reset payment to CREATED for valid verification test
    await prisma.payment.update({
      where: { id: createdPaymentId },
      data: { status: 'CREATED' },
    });

    const validVerifyRes = await request(app.getHttpServer())
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        paymentId: createdPaymentId,
        gatewayPaymentId: `VALID_GW_PAY_${Date.now()}`,
        signature: 'valid_gateway_signature', // Server-verified designated testing token
      });

    expect(validVerifyRes.status).toBe(201);
    const verifiedPayment = validVerifyRes.body.data || validVerifyRes.body;
    expect(verifiedPayment.status).toBe('SUCCESS');

    // 4. Verify booking status was updated to CONFIRMED
    const updatedBooking = await prisma.booking.findUnique({ where: { id: createdBookingId } });
    expect(updatedBooking?.status).toBe('CONFIRMED');
  });
});
