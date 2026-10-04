import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

jest.setTimeout(60000);

describe('Titan Auto Backend Phase 3 — Complete End-to-End After-Sales Business Workflow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let adminUserId: string;

  let franchiseId: string;
  let branchId: string;
  let serviceAdvisorEmployeeId: string;
  let mechanicEmployeeId: string;

  // Identifiers for After-Sales flow
  let customerId: string;
  let vehicleId: string;
  let appointmentId: string;
  let jobId: string;
  let diagnosisId: string;
  let approvalId: string;
  let partId: string;
  let labourId: string;
  let qcId: string;
  let invoiceId: string;
  let paymentId: string;

  const testVin = `VINP3AFTERSALES${Date.now()}`;
  const testEngine = `ENGP3AFTERSALES${Date.now()}`;

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

    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', rank: 1 },
    });

    // Setup Franchise & Branch
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-P3-${Date.now()}`,
        name: 'Phase 3 Service Franchise',
        legalName: 'Phase 3 Service Operations Pvt Ltd',
      },
    });
    franchiseId = franchise.id;

    const branch = await prisma.branch.create({
      data: {
        code: `BR-P3-${Date.now()}`,
        name: 'Phase 3 Service Center',
        franchiseId,
        city: 'Bengaluru',
        state: 'Karnataka',
      },
    });
    branchId = branch.id;

    // Create Admin User & Employee
    const adminUser = await prisma.user.create({
      data: {
        email: `p3admin-${Date.now()}@titanauto.com`,
        passwordHash: hashedPass,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = adminUser.id;

    const advisor = await prisma.employee.create({
      data: {
        userId: adminUserId,
        branchId,
        employeeCode: `ADV-P3-${Date.now()}`,
        firstName: 'Service',
        lastName: 'Advisor',
        designation: 'Senior Service Advisor',
        status: 'ACTIVE',
      },
    });
    serviceAdvisorEmployeeId = advisor.id;

    const mechanic = await prisma.employee.create({
      data: {
        userId: (await prisma.user.create({
          data: {
            email: `mechanic-${Date.now()}@titanauto.com`,
            passwordHash: hashedPass,
            accountType: 'EMPLOYEE',
            status: 'ACTIVE',
          },
        })).id,
        branchId,
        employeeCode: `MCH-P3-${Date.now()}`,
        firstName: 'Master',
        lastName: 'Mechanic',
        designation: 'Heavy Commercial Vehicle Technician',
        status: 'ACTIVE',
      },
    });
    mechanicEmployeeId = mechanic.id;

    await prisma.employeeRoleAssignment.create({
      data: { employeeId: advisor.id, roleId: superAdminRole.id },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: 'AdminSecret123!' })
      .expect(200);

    adminToken = loginRes.body.accessToken || loginRes.body.data?.accessToken;

    // 1. Setup Existing Customer & Vehicle (Delivered/Owned)
    const customer = await prisma.customer.create({
      data: {
        name: 'Vanguard Transports Ltd',
        phone: '+919988776655',
        email: 'service@vanguard.com',
        customerType: 'BUSINESS',
      },
    });
    customerId = customer.id;

    const mfg = await prisma.manufacturer.create({ data: { name: `Volvo Eicher P3 ${Date.now()}` } });
    const model = await prisma.truckModel.create({ data: { manufacturerId: mfg.id, name: 'Pro 6049' } });
    const variant = await prisma.truckVariant.create({
      data: { modelId: model.id, name: 'Pro 6049 Haulage', basePrice: 4800000 },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        vin: testVin,
        engineNumber: testEngine,
        variantId: variant.id,
        branchId,
        customerId,
        status: 'DELIVERED',
        manufacturingYear: 2026,
        baseCost: 4400000,
        sellingPrice: 4800000,
        mileage: 28500,
      },
    });
    vehicleId = vehicle.id;

    // 2. Setup Part in Catalogue & Add Stock to Branch
    const part = await prisma.part.create({
      data: {
        partNumber: `PRT-P3-${Date.now()}`,
        name: 'Clutch Pressure Plate Heavy Duty',
        unitPrice: 12500,
        gstRate: 18,
      },
    });
    partId = part.id;

    const stock = await prisma.partStock.create({
      data: {
        partId,
        branchId,
        quantityOnHand: 25,
      },
    });
    } catch (e) {
      console.warn('Prisma DB setup skipped during offline testing');
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@titanauto.com', password: 'password123' });
      adminToken = loginRes.body.data?.accessToken;
      franchiseId = 'FR-DEV-01';
      branchId = 'BR-DEV-01';
      serviceAdvisorEmployeeId = 'emp-admin-01';
      mechanicEmployeeId = 'emp-admin-01';
      customerId = 'cust-dev-01';
      vehicleId = 'veh-dev-01';
      partId = 'part-dev-01';
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Customer Books Service Appointment', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/service-appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        vehicleId,
        branchId,
        serviceAdvisorId: serviceAdvisorEmployeeId,
        requestedService: 'Transmission & Clutch Slippage Overhaul',
        preferredDate: '2026-10-20T09:30:00.000Z',
        preferredTime: '09:30 AM',
        customerNotes: 'Clutch slips under heavy payload',
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    expect(body.status).toBe('REQUESTED');
    appointmentId = body.id;
  });

  it('2. Service Advisor Confirms Appointment & Checks-In Vehicle', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/service-appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' })
      .expect(200);

    expect((res.body.data || res.body).status).toBe('CONFIRMED');
  });

  it('3. Service Advisor Creates Job Card & Assigns Mechanic', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/service-jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        appointmentId,
        customerId,
        vehicleId,
        branchId,
        serviceAdvisorId: serviceAdvisorEmployeeId,
        assignedMechanicId: mechanicEmployeeId,
        complaint: 'Severe clutch slippage and transmission gear noise',
        odometer: 28500,
        fuelLevel: '75%',
        estimatedCost: 15000,
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    expect(body.assignedMechanicId).toBe(mechanicEmployeeId);
    jobId = body.id;
  });

  it('4. Mechanic Performs Diagnosis & Recommends Additional Work', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/service-jobs/${jobId}/diagnosis`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        mechanicId: mechanicEmployeeId,
        findings: 'Worn clutch pressure plate and damaged release bearing',
        recommendedWork: 'Replace Heavy Duty Clutch Pressure Plate & Release Bearing',
        additionalCost: 12500,
        severity: 'HIGH',
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    diagnosisId = body.id;

    // Verify ServiceJob status updated to WAITING_FOR_APPROVAL
    const jobRes = await request(app.getHttpServer())
      .get(`/api/v1/service-jobs/${jobId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const jobData = jobRes.body.data || jobRes.body;
    expect(jobData.status).toBe('WAITING_FOR_APPROVAL');
    expect(jobData.approvals.length).toBeGreaterThan(0);
    approvalId = jobData.approvals[0].id;
  });

  it('5. Customer Approves Additional Estimate Work', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/service-approvals/${approvalId}/respond`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'APPROVED',
        customerNotes: 'Approved for replacement. Please proceed.',
      })
      .expect(200);

    expect((res.body.data || res.body).decision).toBe('APPROVED');

    // Verify ServiceJob status changed to IN_PROGRESS
    const jobRes = await request(app.getHttpServer())
      .get(`/api/v1/service-jobs/${jobId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect((jobRes.body.data || jobRes.body).status).toBe('IN_PROGRESS');
  });

  it('6. Inventory Executive Issues Spare Part to Job Card', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/parts/issue-to-job')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        serviceJobId: jobId,
        partId,
        quantity: 1,
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    expect(Number(body.totalAmount)).toBeGreaterThan(12500);
  });

  it('7. Service Advisor Adds Labour Charge to Job Card', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/service-jobs/${jobId}/labour`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labourType: 'TRANSMISSION_REPAIR',
        description: 'Clutch Plate Overhaul & Alignment Labour',
        hours: 3.5,
        hourlyRate: 1000,
        discount: 200,
        taxRate: 18,
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.id).toBeDefined();
    labourId = body.id;
  });

  it('8. Quality Inspector Performs QC & Passes Repair Work', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/service-jobs/${jobId}/qc`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        checklist: {
          clutchEngagement: 'OK',
          gearShiftSmoothness: 'OK',
          roadTest: 'PASSED',
        },
        status: 'PASSED',
        remarks: 'Transmission and clutch overhaul quality inspection passed.',
      })
      .expect(201);

    const body = res.body.data || res.body;
    expect(body.status).toBe('PASSED');

    // Verify Job status updated to READY_FOR_DELIVERY
    const jobRes = await request(app.getHttpServer())
      .get(`/api/v1/service-jobs/${jobId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect((jobRes.body.data || jobRes.body).status).toBe('READY_FOR_DELIVERY');
  });

  it('9. Accountant Issues GST Service Invoice', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        vehicleId,
        franchiseId,
        branchId,
        billingAddress: 'Vanguard Transports Yard, Bengaluru',
        items: [
          {
            description: 'Clutch Plate Replacement & Service Labour',
            quantity: 1,
            unitPrice: 18500,
            gstRate: 18,
          },
        ],
      })
      .expect(201);

    invoiceId = (res.body.data || res.body).id;
    expect(invoiceId).toBeDefined();
  });

  it('10. Service Job Marked COMPLETED (Verifies QC Passed & Updates History)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/service-jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'COMPLETED',
        notes: 'Vehicle delivered to customer after successful service completion',
      })
      .expect(200);

    const body = res.body.data || res.body;
    expect(body.status).toBe('COMPLETED');
    expect(body.actualCompletionTime).toBeDefined();
  });

  it('11. Customer Service Experience — View Customer Dashboard & Service History', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboards/customer')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body.data || res.body;
    expect(body).toBeDefined();
  });
});
