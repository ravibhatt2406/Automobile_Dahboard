import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

jest.setTimeout(60000);

describe('Phase 5 — Complete Service Workshop Workflow Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testPassword = 'ActualSecurePassword123!';
  const ts = Date.now();

  let franchiseId: string;
  let branchAId: string;
  let branchBId: string;

  let superAdminToken: string;
  let branchManagerAToken: string;
  let serviceAdvisorAToken: string;
  let serviceAdvisorAEmployeeId: string;
  let serviceAdvisorBToken: string;
  let serviceAdvisorBEmployeeId: string;
  let mechanicAToken: string;
  let mechanicAEmployeeId: string;
  let mechanicBToken: string;
  let mechanicBEmployeeId: string;

  let customerAToken: string;
  let customerAId: string;
  let customerBToken: string;
  let customerBId: string;

  let vehicleAId: string;
  let vehicleAVin: string;
  let vehicleBId: string;

  let createdAppointmentId: string;
  let createdJobId: string;
  let createdPartId: string;

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
    const saRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', description: 'Global Super Administrator' },
    });
    const bmRole = await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: {},
      create: { name: 'BRANCH_MANAGER', description: 'Branch Operations Head' },
    });
    const saAdvisorRole = await prisma.role.upsert({
      where: { name: 'SERVICE_ADVISOR' },
      update: {},
      create: { name: 'SERVICE_ADVISOR', description: 'Workshop Front Desk Advisor' },
    });
    const mechRole = await prisma.role.upsert({
      where: { name: 'MECHANIC' },
      update: {},
      create: { name: 'MECHANIC', description: 'Bay Workshop Technician' },
    });

    // 2. Setup Franchise and Branches
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-P5-${ts}`,
        name: `Bharat Service Hub P5 ${ts}`,
        status: 'ACTIVE',
      },
    });
    franchiseId = franchise.id;

    const branchA = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-P5-A-${ts}`,
        name: `Jaipur Workshop P5 ${ts}`,
        city: 'Jaipur',
        status: 'ACTIVE',
      },
    });
    branchAId = branchA.id;

    const branchB = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-P5-B-${ts}`,
        name: `Jodhpur Workshop P5 ${ts}`,
        city: 'Jodhpur',
        status: 'ACTIVE',
      },
    });
    branchBId = branchB.id;

    // 3. Super Admin
    const saUser = await prisma.user.create({
      data: {
        email: `sa_p5_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    // 4. Branch Manager A
    const bmUser = await prisma.user.create({
      data: {
        email: `bm_p5_a_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-BM5-${ts}`,
            firstName: 'Vikram',
            lastName: 'Rathore',
            designation: 'Branch Manager',
            status: 'ACTIVE',
            branchId: branchAId,
            roleAssignments: { create: { roleId: bmRole.id } },
          },
        },
      },
    });

    // 5. Service Advisor A (Branch A)
    const advisorAUser = await prisma.user.create({
      data: {
        email: `advisor_p5_a_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-ADV5-A-${ts}`,
            firstName: 'Karan',
            lastName: 'Sharma',
            designation: 'Service Advisor',
            status: 'ACTIVE',
            branchId: branchAId,
            roleAssignments: { create: { roleId: saAdvisorRole.id } },
          },
        },
      },
      include: { employeeProfile: true },
    });
    serviceAdvisorAEmployeeId = advisorAUser.employeeProfile!.id;

    // 6. Service Advisor B (Branch B)
    const advisorBUser = await prisma.user.create({
      data: {
        email: `advisor_p5_b_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-ADV5-B-${ts}`,
            firstName: 'Sunil',
            lastName: 'Verma',
            designation: 'Service Advisor',
            status: 'ACTIVE',
            branchId: branchBId,
            roleAssignments: { create: { roleId: saAdvisorRole.id } },
          },
        },
      },
      include: { employeeProfile: true },
    });
    serviceAdvisorBEmployeeId = advisorBUser.employeeProfile!.id;

    // 7. Mechanic A (Branch A)
    const mechAUser = await prisma.user.create({
      data: {
        email: `mech_p5_a_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-MEC5-A-${ts}`,
            firstName: 'Raju',
            lastName: 'Mistri',
            designation: 'Lead Mechanic',
            status: 'ACTIVE',
            branchId: branchAId,
            roleAssignments: { create: { roleId: mechRole.id } },
          },
        },
      },
      include: { employeeProfile: true },
    });
    mechanicAEmployeeId = mechAUser.employeeProfile!.id;

    // 8. Mechanic B (Branch B)
    const mechBUser = await prisma.user.create({
      data: {
        email: `mech_p5_b_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-MEC5-B-${ts}`,
            firstName: 'Sohan',
            lastName: 'Lal',
            designation: 'Technician',
            status: 'ACTIVE',
            branchId: branchBId,
            roleAssignments: { create: { roleId: mechRole.id } },
          },
        },
      },
      include: { employeeProfile: true },
    });
    mechanicBEmployeeId = mechBUser.employeeProfile!.id;

    // 9. Customer A & Customer B
    const custAUser = await prisma.user.create({
      data: {
        email: `cust_p5_a_${ts}@logistics.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    const customerA = await prisma.customer.create({
      data: {
        userId: custAUser.id,
        name: 'Alpha Express Freight Ltd',
        phone: `+9199000${Math.floor(10000 + Math.random() * 90000)}`,
        email: custAUser.email,
        companyName: 'Alpha Express Freight Ltd',
        status: 'ACTIVE',
      },
    });
    customerAId = customerA.id;

    const custBUser = await prisma.user.create({
      data: {
        email: `cust_p5_b_${ts}@cargo.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    const customerB = await prisma.customer.create({
      data: {
        userId: custBUser.id,
        name: 'Beta Trans Logistics',
        phone: `+9199111${Math.floor(10000 + Math.random() * 90000)}`,
        email: custBUser.email,
        companyName: 'Beta Trans Logistics',
        status: 'ACTIVE',
      },
    });
    customerBId = customerB.id;

    // 10. Vehicles Setup
    const mfr = await prisma.manufacturer.create({
      data: { name: `Ashok Leyland Workshop ${ts}`, country: 'India' },
    });
    const model = await prisma.truckModel.create({
      data: { manufacturerId: mfr.id, name: `Captain Workshop ${ts}`, category: 'HEAVY_DUTY' },
    });
    const variant = await prisma.truckVariant.create({
      data: {
        modelId: model.id,
        name: '2820 BS6 Stage II',
        basePrice: 3200000,
        gstRate: 28,
        status: 'ACTIVE',
      },
    });

    vehicleAVin = `VIN-SRV-A-${ts}`;
    const vehicleA = await prisma.vehicle.create({
      data: {
        vin: vehicleAVin,
        engineNumber: `ENG-SRV-A-${ts}`,
        variantId: variant.id,
        branchId: branchAId,
        customerId: customerAId,
        manufacturingYear: 2024,
        color: 'Signal White',
        baseCost: 2800000,
        sellingPrice: 3200000,
        status: 'DELIVERED',
      },
    });
    vehicleAId = vehicleA.id;

    const vehicleB = await prisma.vehicle.create({
      data: {
        vin: `VIN-SRV-B-${ts}`,
        engineNumber: `ENG-SRV-B-${ts}`,
        variantId: variant.id,
        branchId: branchBId,
        customerId: customerBId,
        manufacturingYear: 2024,
        color: 'Oxford Blue',
        baseCost: 2800000,
        sellingPrice: 3200000,
        status: 'DELIVERED',
      },
    });
    vehicleBId = vehicleB.id;

    // 11. Login Tokens
    const login = async (email: string) => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email,
        password: testPassword,
      });
      return res.body.accessToken || res.body.data?.accessToken;
    };

    superAdminToken = await login(saUser.email);
    branchManagerAToken = await login(bmUser.email);
    serviceAdvisorAToken = await login(advisorAUser.email);
    serviceAdvisorBToken = await login(advisorBUser.email);
    mechanicAToken = await login(mechAUser.email);
    mechanicBToken = await login(mechBUser.email);
    customerAToken = await login(custAUser.email);
    customerBToken = await login(custBUser.email);
  });

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Customer Service Booking
  it('1. Customer service booking: Customer books appointment for their owned vehicle', async () => {
    const bookRes = await request(app.getHttpServer())
      .post('/api/v1/service-appointments')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        customerId: customerAId,
        vehicleId: vehicleAId,
        branchId: branchAId,
        requestedService: '40,000 KM Periodic Haulage Inspection & Brake Overhaul',
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        preferredTime: '10:00 AM',
        customerNotes: 'Brake pedal feels spongy during downhill payload haulage',
      });

    expect(bookRes.status).toBe(201);
    const appointment = bookRes.body.data || bookRes.body;
    expect(appointment.id).toBeDefined();
    expect(appointment.appointmentNumber).toMatch(/^APT-/);
    expect(appointment.customerId).toBe(customerAId);
    expect(appointment.vehicleId).toBe(vehicleAId);
    expect(appointment.status).toBe('REQUESTED');

    createdAppointmentId = appointment.id;
  });

  // TEST 2: Customer Ownership Enforcement
  it('2. Customer ownership: Customer cannot book service for another customer vehicle', async () => {
    const crossBookingRes = await request(app.getHttpServer())
      .post('/api/v1/service-appointments')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        customerId: customerAId,
        vehicleId: vehicleBId, // Owned by Customer B!
        branchId: branchAId,
        requestedService: 'Unauthorized brake overhaul test',
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(crossBookingRes.status).toBe(403);
    expect(crossBookingRes.body.message).toContain('not owned by you');
  });

  // TEST 3: Service Job Card Creation & Cross-Branch Isolation
  it('3. Service Job Card: Service Advisor creates job card from appointment, updates vehicle to SERVICE', async () => {
    // Advisor B (from Branch B) attempts to create job in Branch A -> 403 Forbidden
    const crossBranchJobRes = await request(app.getHttpServer())
      .post('/api/v1/service-jobs')
      .set('Authorization', `Bearer ${serviceAdvisorBToken}`)
      .send({
        customerId: customerAId,
        vehicleId: vehicleAId,
        branchId: branchAId,
        serviceAdvisorId: serviceAdvisorBEmployeeId,
        complaint: 'Unauthorized cross-branch job card creation attempt',
      });

    expect(crossBranchJobRes.status).toBe(403);

    // Authorized Advisor A (from Branch A) creates job card
    const jobRes = await request(app.getHttpServer())
      .post('/api/v1/service-jobs')
      .set('Authorization', `Bearer ${serviceAdvisorAToken}`)
      .send({
        appointmentId: createdAppointmentId,
        customerId: customerAId,
        vehicleId: vehicleAId,
        branchId: branchAId,
        serviceAdvisorId: serviceAdvisorAEmployeeId,
        complaint: 'Heavy brake pedal sponge and engine hesitation under payload',
        odometer: 42500,
        fuelLevel: '75%',
        estimatedCost: 35000,
        notes: 'Priority fleet turnaround requested by client',
      });

    expect(jobRes.status).toBe(201);
    const job = jobRes.body.data || jobRes.body;
    expect(job.id).toBeDefined();
    expect(job.jobNumber).toMatch(/^JOB-/);
    expect(job.status).toBe('OPEN');
    createdJobId = job.id;

    // Verify appointment transitioned to CONVERTED_TO_JOB
    const appt = await prisma.serviceAppointment.findUnique({ where: { id: createdAppointmentId } });
    expect(appt?.status).toBe('CONVERTED_TO_JOB');

    // Verify vehicle status transitioned to SERVICE
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleAId } });
    expect(vehicle?.status).toBe('SERVICE');
  });

  // TEST 4: Mechanic Assignment & Validation
  it('4. Mechanic assignment: Validates branch match and transitions job to CHECKED_IN', async () => {
    // Attempt to assign Mechanic B (from Branch B) to job in Branch A -> 400 Bad Request
    const invalidAssignRes = await request(app.getHttpServer())
      .patch(`/api/v1/service-jobs/${createdJobId}/assign-mechanic`)
      .set('Authorization', `Bearer ${serviceAdvisorAToken}`)
      .send({
        mechanicId: mechanicBEmployeeId,
      });

    expect(invalidAssignRes.status).toBe(400);
    expect(invalidAssignRes.body.message).toContain('not the job\'s branch');

    // Assign Mechanic A (from Branch A)
    const validAssignRes = await request(app.getHttpServer())
      .patch(`/api/v1/service-jobs/${createdJobId}/assign-mechanic`)
      .set('Authorization', `Bearer ${serviceAdvisorAToken}`)
      .send({
        mechanicId: mechanicAEmployeeId,
      });

    expect(validAssignRes.status).toBe(200);
    const updatedJob = await prisma.serviceJob.findUnique({ where: { id: createdJobId } });
    expect(updatedJob?.assignedMechanicId).toBe(mechanicAEmployeeId);
    expect(updatedJob?.status).toBe('CHECKED_IN');
  });

  // TEST 5: Mechanic Identity & Job Queue Scoping
  it('5. Mechanic identity: Authenticated mechanic sees only their assigned jobs and cannot be overridden', async () => {
    // Mechanic A queries their jobs -> Sees created job
    const myJobsRes = await request(app.getHttpServer())
      .get('/api/v1/service-jobs/mechanic/my-jobs')
      .set('Authorization', `Bearer ${mechanicAToken}`);

    expect(myJobsRes.status).toBe(200);
    const jobs = Array.isArray(myJobsRes.body) ? myJobsRes.body : myJobsRes.body.data || [];
    const jobIds = jobs.map((j: any) => j.id);
    expect(jobIds).toContain(createdJobId);

    // Mechanic A attempts to pass Mechanic B's ID in query -> Identity is strictly enforced, Mechanic B's jobs are NOT returned
    const spoofRes = await request(app.getHttpServer())
      .get(`/api/v1/service-jobs/mechanic/my-jobs?mechanicId=${mechanicBEmployeeId}`)
      .set('Authorization', `Bearer ${mechanicAToken}`);

    expect(spoofRes.status).toBe(200);
    const spoofJobs = Array.isArray(spoofRes.body) ? spoofRes.body : spoofRes.body.data || [];
    const spoofIds = spoofJobs.map((j: any) => j.id);
    expect(spoofIds).toContain(createdJobId); // Still returns Mechanic A's jobs!

    // Mechanic B queries their jobs -> Does NOT see Mechanic A's job
    const mechBJobsRes = await request(app.getHttpServer())
      .get('/api/v1/service-jobs/mechanic/my-jobs')
      .set('Authorization', `Bearer ${mechanicBToken}`);

    expect(mechBJobsRes.status).toBe(200);
    const bJobs = Array.isArray(mechBJobsRes.body) ? mechBJobsRes.body : mechBJobsRes.body.data || [];
    const bJobIds = bJobs.map((j: any) => j.id);
    expect(bJobIds).not.toContain(createdJobId);
  });

  // TEST 6: Diagnosis Recording & Progress
  it('6. Diagnosis: Mechanic records inspection findings and updates job progress', async () => {
    const diagRes = await request(app.getHttpServer())
      .post(`/api/v1/service-jobs/${createdJobId}/diagnosis`)
      .set('Authorization', `Bearer ${mechanicAToken}`)
      .send({
        findings: 'Severe front brake pad wear down to 1.5mm, hydraulic line air pocket, engine fuel filter clogged',
        recommendedWork: 'Replace Heavy Duty Brake Pad Kit, Bleed Hydraulic Circuit, Replace Secondary Fuel Filter',
        severity: 'HIGH',
        additionalCost: 12500,
        notes: 'Immediate pad replacement necessary to prevent rotor scoring',
      });

    expect(diagRes.status).toBe(201);
    const diag = diagRes.body.data || diagRes.body;
    expect(diag.id).toBeDefined();
    expect(diag.mechanicId).toBe(mechanicAEmployeeId);

    // Because additionalCost > 0, approval record created and job status set to WAITING_FOR_APPROVAL
    const jobAfterDiag = await prisma.serviceJob.findUnique({
      where: { id: createdJobId },
      include: { approvals: true },
    });
    expect(jobAfterDiag?.status).toBe('WAITING_FOR_APPROVAL');
    expect(jobAfterDiag?.approvals.length).toBeGreaterThanOrEqual(1);

    // Customer A approves additional diagnosis work
    const approvalId = jobAfterDiag!.approvals[0].id;
    const approvalRes = await request(app.getHttpServer())
      .patch(`/api/v1/service-approvals/${approvalId}/respond`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        decision: 'APPROVED',
        customerNotes: 'Approved for urgent commercial fleet dispatch',
      });

    expect(approvalRes.status).toBe(200);
    const jobAfterApproval = await prisma.serviceJob.findUnique({ where: { id: createdJobId } });
    expect(jobAfterApproval?.status).toBe('IN_PROGRESS');
  });

  // TEST 7: Spare Parts Stock Deduction & Concurrency
  it('7. Spare parts: Deducts stock safely via transaction and links part usage to service job', async () => {
    // Create Part in catalogue
    const partRes = await request(app.getHttpServer())
      .post('/api/v1/parts')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        partNumber: `PRT-BRK-${ts}`,
        name: 'Heavy Haulage Ceramic Brake Pad Set',
        description: 'Commercial 28T ceramic brake pad kit',
        manufacturer: 'Titan Genuine Parts',
        category: 'BRAKES',
        unitPrice: 8500,
        gstRate: 18,
      });

    expect(partRes.status).toBe(201);
    createdPartId = (partRes.body.data || partRes.body).id;

    // Add 10 units to Branch A stock
    await request(app.getHttpServer())
      .post('/api/v1/parts/stock-movement')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        partId: createdPartId,
        branchId: branchAId,
        movementType: 'PURCHASE',
        quantity: 10,
        notes: 'Initial workshop stock intake',
      });

    const stockBefore = await prisma.partStock.findUnique({
      where: { partId_branchId: { partId: createdPartId, branchId: branchAId } },
    });
    expect(stockBefore?.quantityOnHand).toBe(10);

    // Issue 2 units to the service job
    const issueRes = await request(app.getHttpServer())
      .post('/api/v1/parts/issue-to-job')
      .set('Authorization', `Bearer ${serviceAdvisorAToken}`)
      .send({
        serviceJobId: createdJobId,
        partId: createdPartId,
        quantity: 2,
      });

    expect(issueRes.status).toBe(201);
    const jobPart = issueRes.body.data || issueRes.body;
    expect(jobPart.id).toBeDefined();
    expect(jobPart.quantity).toBe(2);
    expect(jobPart.status).toBe('ISSUED');

    // Verify stock reduced from 10 to 8
    const stockAfter = await prisma.partStock.findUnique({
      where: { partId_branchId: { partId: createdPartId, branchId: branchAId } },
    });
    expect(stockAfter?.quantityOnHand).toBe(8);

    // Verify part usage movement recorded
    const movements = await prisma.partStockMovement.findMany({
      where: { partStockId: stockAfter!.id, movementType: 'ISSUE' },
    });
    expect(movements.length).toBeGreaterThanOrEqual(1);
  });

  // TEST 8: Insufficient Stock Prevention
  it('8. Insufficient stock: Rejects consumption exceeding available inventory and prevents negative stock', async () => {
    // Attempt to issue 50 units when only 8 are available
    const overIssueRes = await request(app.getHttpServer())
      .post('/api/v1/parts/issue-to-job')
      .set('Authorization', `Bearer ${serviceAdvisorAToken}`)
      .send({
        serviceJobId: createdJobId,
        partId: createdPartId,
        quantity: 50,
      });

    expect(overIssueRes.status).toBe(400);
    expect(overIssueRes.body.message).toContain('Insufficient Stock');

    // Verify stock remained unchanged at 8
    const stock = await prisma.partStock.findUnique({
      where: { partId_branchId: { partId: createdPartId, branchId: branchAId } },
    });
    expect(stock?.quantityOnHand).toBe(8);
  });

  // TEST 9: Quality Control & Service Completion
  it('9. Quality Control & Service Completion: Enforces mandatory QC before completion, generates invoice, and returns vehicle', async () => {
    // Attempt premature completion before QC -> Blocked with 400 Bad Request
    const prematureComplete = await request(app.getHttpServer())
      .patch(`/api/v1/service-jobs/${createdJobId}/status`)
      .set('Authorization', `Bearer ${serviceAdvisorAToken}`)
      .send({
        status: 'COMPLETED',
        notes: 'Attempting completion without QC',
      });

    expect(prematureComplete.status).toBe(400);
    expect(prematureComplete.body.message).toContain('PASSED Quality Control');

    // Add Labour Charges
    const labourRes = await request(app.getHttpServer())
      .post(`/api/v1/service-jobs/${createdJobId}/labour`)
      .set('Authorization', `Bearer ${serviceAdvisorAToken}`)
      .send({
        labourType: 'BRAKE_OVERHAUL',
        description: 'Complete axle brake caliper overhaul and rotor machining',
        hours: 3.5,
        hourlyRate: 1500,
        discount: 250,
        taxRate: 18,
      });

    expect(labourRes.status).toBe(201);

    // Conduct and pass Quality Control inspection
    const qcRes = await request(app.getHttpServer())
      .post(`/api/v1/service-jobs/${createdJobId}/qc`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        checklist: {
          brakeTest: 'PASSED',
          hydraulicPressure: 'OK',
          wheelTorque: 'OK',
          roadTest: 'EXCELLENT',
          fluidLevels: 'VERIFIED',
        },
        status: 'PASSED',
        remarks: 'All safety and brake performance standards certified',
      });

    expect(qcRes.status).toBe(201);

    // Now complete the service job
    const completeRes = await request(app.getHttpServer())
      .patch(`/api/v1/service-jobs/${createdJobId}/status`)
      .set('Authorization', `Bearer ${serviceAdvisorAToken}`)
      .send({
        status: 'COMPLETED',
        notes: 'Commercial service overhaul completed and vehicle handed over',
      });

    expect(completeRes.status).toBe(200);

    // Verify service job completed
    const completedJob = await prisma.serviceJob.findUnique({
      where: { id: createdJobId },
      include: { serviceInvoice: { include: { items: true } } },
    });
    expect(completedJob?.status).toBe('COMPLETED');
    expect(completedJob?.actualCompletionTime).toBeDefined();

    // Verify invoice generated with parts and labour items
    expect(completedJob?.serviceInvoiceId).toBeDefined();
    expect(completedJob?.serviceInvoice?.invoiceNumber).toMatch(/^INV-SRV-/);
    expect(completedJob?.serviceInvoice?.items.length).toBeGreaterThanOrEqual(2);

    // Verify vehicle transitioned back to DELIVERED
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleAId } });
    expect(vehicle?.status).toBe('DELIVERED');
  });

  // TEST 10: Service History & Multi-Tenant Isolation
  it('10. Service history: Customer sees their own vehicle service history, cross-customer and cross-branch access blocked', async () => {
    // Customer A queries vehicle A service history -> Receives service history
    const historyRes = await request(app.getHttpServer())
      .get(`/api/v1/service-jobs/vehicle/${vehicleAId}`)
      .set('Authorization', `Bearer ${customerAToken}`);

    expect(historyRes.status).toBe(200);
    const historyJobs = Array.isArray(historyRes.body) ? historyRes.body : historyRes.body.data || [];
    expect(historyJobs.length).toBeGreaterThanOrEqual(1);
    expect(historyJobs[0].id).toBe(createdJobId);
    expect(historyJobs[0].serviceInvoice).toBeDefined();

    // Customer B attempts to query Vehicle A's service history -> 403 Forbidden
    const crossCustomerRes = await request(app.getHttpServer())
      .get(`/api/v1/service-jobs/vehicle/${vehicleAId}`)
      .set('Authorization', `Bearer ${customerBToken}`);

    expect(crossCustomerRes.status).toBe(403);
    expect(crossCustomerRes.body.message).toContain('not owned by you');

    // Service Advisor B (Branch B) attempts to query Vehicle A (Branch A) service history -> 403 Forbidden
    const crossBranchRes = await request(app.getHttpServer())
      .get(`/api/v1/service-jobs/vehicle/${vehicleAId}`)
      .set('Authorization', `Bearer ${serviceAdvisorBToken}`);

    expect(crossBranchRes.status).toBe(403);
    expect(crossBranchRes.body.message).toContain('another branch');
  });
});
