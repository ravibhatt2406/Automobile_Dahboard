import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

jest.setTimeout(60000);

describe('Phase 2 — Billing and Invoices Automated Test Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testPassword = 'BillingSecurePass123!';
  const ts = Date.now();

  let franchiseId: string;
  let branchAId: string;
  let branchBId: string;

  let superAdminToken: string;
  let branchManagerAToken: string;
  let branchManagerBToken: string;

  let customerAId: string;
  let customerAToken: string;

  let bookingAId: string;
  let createdInvoiceId: string;

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

    // 1. Roles
    const bmRole = await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: {},
      create: { name: 'BRANCH_MANAGER', description: 'Branch Operations Manager' },
    });

    // 2. Franchise
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-BIL-${ts}`,
        name: `Billing Franchise ${ts}`,
        status: 'ACTIVE',
      },
    });
    franchiseId = franchise.id;

    // 3. Branches
    const branchA = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-BILA-${ts}`,
        name: `Billing Dealership Alpha ${ts}`,
        city: 'Pune',
        status: 'ACTIVE',
      },
    });
    branchAId = branchA.id;

    const branchB = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-BILB-${ts}`,
        name: `Billing Dealership Beta ${ts}`,
        city: 'Nagpur',
        status: 'ACTIVE',
      },
    });
    branchBId = branchB.id;

    // 4. Super Admin
    await prisma.user.create({
      data: {
        email: `sa_billing_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    // 5. Branch Managers
    const bmUserA = await prisma.user.create({
      data: {
        email: `bm_bila_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-BILA-${ts}`,
            firstName: 'Vikram',
            lastName: 'Mehta',
            designation: 'Branch Manager',
            status: 'ACTIVE',
            branchId: branchAId,
            roleAssignments: { create: { roleId: bmRole.id } },
          },
        },
      },
      include: { employeeProfile: true },
    });

    await prisma.user.create({
      data: {
        email: `bm_bilb_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-BILB-${ts}`,
            firstName: 'Sunil',
            lastName: 'Verma',
            designation: 'Branch Manager',
            status: 'ACTIVE',
            branchId: branchBId,
            roleAssignments: { create: { roleId: bmRole.id } },
          },
        },
      },
    });

    // 6. Customer A
    const custUserA = await prisma.user.create({
      data: {
        email: `customer_bila_${ts}@express.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            name: 'Apex Super Transports',
            companyName: 'Apex Logistics Ltd',
            phone: `+919877${Math.floor(100000 + Math.random() * 900000)}`,
            email: `customer_bila_${ts}@express.com`,
            address: 'Express Towers, Pune',
            city: 'Pune',
            state: 'Maharashtra',
            gstin: '27AAPCA1234F1Z5',
            status: 'ACTIVE',
            franchiseLinks: { create: { franchiseId } },
          },
        },
      },
      include: { customerProfile: true },
    });
    customerAId = custUserA.customerProfile!.id;

    // 7. Test Variant, Quotation & Booking for Duplicate Testing
    const variant = await prisma.truckVariant.findFirst();
    if (!variant) {
      throw new Error('Database is missing seed truck variants');
    }

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: `QUO-BIL-${ts}`,
        customerId: customerAId,
        franchiseId,
        branchId: branchAId,
        salespersonEmployeeId: bmUserA.employeeProfile!.id,
        createdByUserId: bmUserA.id,
        variantId: variant.id,
        unitBasePrice: 100000,
        subtotal: 100000,
        gstRate: 18,
        gstAmount: 18000,
        totalAmount: 118000,
        validityDate: new Date(Date.now() + 86400000 * 30),
        status: 'APPROVED',
      },
    });

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `BKG-BIL-${ts}`,
        customerId: customerAId,
        quotationId: quotation.id,
        branchId: branchAId,
        salespersonEmployeeId: bmUserA.employeeProfile!.id,
        bookingAmount: 25000,
        totalAmount: 118000,
        status: 'CONFIRMED',
      },
    });
    bookingAId = booking.id;

    // Logins
    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: testPassword });
      return res.body.data?.accessToken || res.body.accessToken;
    };

    superAdminToken = await login(`sa_billing_${ts}@titanauto.com`);
    branchManagerAToken = await login(`bm_bila_${ts}@titanauto.com`);
    branchManagerBToken = await login(`bm_bilb_${ts}@titanauto.com`);
    customerAToken = await login(`customer_bila_${ts}@express.com`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Should list invoices successfully with branch scoping', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/invoices')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('items');
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('2. Should create an invoice with verified server-side GST calculations', async () => {
    const payload = {
      customerId: customerAId,
      branchId: branchAId,
      bookingId: bookingAId,
      billingAddress: 'Express Towers, Pune',
      gstin: '27AAPCA1234F1Z5',
      isInterState: false, // Intra-state (CGST + SGST)
      discount: 1000,
      items: [
        {
          description: 'Heavy Commercial Axle Assembly',
          quantity: 2,
          unitPrice: 50000, // Subtotal: 100,000
          gstRate: 18,
        },
      ],
    };

    // Subtotal: 100,000
    // Discount: 1,000 -> Taxable: 99,000
    // CGST (9%): 8,910
    // SGST (9%): 8,910
    // Total Tax: 17,820
    // Grand Total: 116,820

    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    const invoice = res.body.data;
    expect(invoice.id).toBeDefined();
    expect(invoice.invoiceNumber).toMatch(/^INV-/);
    expect(Number(invoice.subtotal)).toBe(100000);
    expect(Number(invoice.discount)).toBe(1000);
    expect(Number(invoice.taxableAmount)).toBe(99000);
    expect(Number(invoice.cgstAmount)).toBe(9000);
    expect(Number(invoice.sgstAmount)).toBe(9000);
    expect(Number(invoice.igstAmount)).toBe(0);
    expect(Number(invoice.totalAmount)).toBe(117000);
    expect(invoice.status).toBe('ISSUED');
    expect(invoice.paymentStatus).toBe('UNPAID');

    createdInvoiceId = invoice.id;
  });

  it('3. Should reject duplicate invoice creation for the same booking', async () => {
    const duplicatePayload = {
      customerId: customerAId,
      branchId: branchAId,
      bookingId: bookingAId,
      billingAddress: 'Express Towers, Pune',
      items: [
        {
          description: 'Duplicate Request',
          quantity: 1,
          unitPrice: 10000,
          gstRate: 18,
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send(duplicatePayload)
      .expect(400);

    expect(res.body.message).toMatch(/Active invoice .* already exists for booking/i);
  });

  it('4. Should retrieve invoice detail with all relationships', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/invoices/${createdInvoiceId}`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const invoice = res.body.data;
    expect(invoice.id).toBe(createdInvoiceId);
    expect(invoice.customer.name).toBe('Apex Super Transports');
    expect(invoice.branch.id).toBe(branchAId);
    expect(invoice.items.length).toBe(1);
    expect(invoice.booking.id).toBe(bookingAId);
  });

  it('5. Should render and download printable GST tax invoice HTML', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/invoices/${createdInvoiceId}/pdf/download`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('TAX INVOICE');
    expect(res.text).toContain('Apex Super Transports');
    expect(res.text).toContain('27AAPCA1234F1Z5');
    expect(res.text).toContain('Heavy Commercial Axle Assembly');
    expect(res.text).toContain('1,17,000.00');
  });

  it('6. Should reject payment exceeding the remaining invoice balance', async () => {
    const excessPayment = {
      amount: 150000, // Total is 117,000
      paymentMethod: 'NEFT',
      transactionReference: 'NEFT-EXCESS-001',
    };

    const res = await request(app.getHttpServer())
      .post(`/api/v1/invoices/${createdInvoiceId}/payments`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send(excessPayment)
      .expect(400);

    expect(res.body.message).toMatch(/cannot exceed remaining invoice balance/i);
  });

  it('7. Should record partial payment and update status to PARTIALLY_PAID', async () => {
    const partialPayment = {
      amount: 50000,
      paymentMethod: 'RTGS',
      transactionReference: 'RTGS-PARTIAL-001',
    };

    const res = await request(app.getHttpServer())
      .post(`/api/v1/invoices/${createdInvoiceId}/payments`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send(partialPayment)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentStatus).toBe('PARTIALLY_PAID');
    expect(res.body.data.payments.length).toBe(1);
    expect(Number(res.body.data.payments[0].amount)).toBe(50000);
  });

  it('8. Should record remaining balance payment and update status to PAID', async () => {
    const finalPayment = {
      amount: 67000,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: 'TXN-FINAL-002',
    };

    const res = await request(app.getHttpServer())
      .post(`/api/v1/invoices/${createdInvoiceId}/payments`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send(finalPayment)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentStatus).toBe('PAID');
    expect(res.body.data.status).toBe('PAID');
    expect(res.body.data.payments.length).toBe(2);

    // Verify DB invoice status
    const verified = await prisma.invoice.findUnique({
      where: { id: createdInvoiceId },
      include: { payments: true },
    });
    expect(verified?.paymentStatus).toBe('PAID');
    expect(verified?.payments.length).toBe(2);
  });

  it('9. Should block unauthorized branch employee from accessing Branch A invoice', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/invoices/${createdInvoiceId}`)
      .set('Authorization', `Bearer ${branchManagerBToken}`)
      .expect(403);

    expect(res.body.message).toMatch(/another branch|outside your authorized branch/i);
  });

  it('10. Should allow customer to access their own invoice', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/invoices/${createdInvoiceId}`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdInvoiceId);
  });
});
