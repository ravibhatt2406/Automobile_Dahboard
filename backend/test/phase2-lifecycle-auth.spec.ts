import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

jest.setTimeout(60000);

describe('Phase 2 — Employee Lifecycle, Role Assignment, Identity & Integrity Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens & Identifiers
  let superAdminToken: string;
  let superAdminUserId: string;

  let franchiseId: string;
  let branchAId: string;
  let branchBId: string;

  let bmA1Token: string;
  let bmA1UserId: string;
  let bmA1EmpId: string;

  let bmA2Token: string;
  let bmA2UserId: string;
  let bmA2EmpId: string;

  let bmB1Token: string;
  let bmB1UserId: string;
  let bmB1EmpId: string;

  let mechanicToken: string;
  let mechanicUserId: string;
  let mechanicEmpId: string;

  let multiRoleEmployeeId: string;
  let multiRoleUserId: string;
  let multiRoleToken: string;

  const testPassword = 'ActualStoredSecurePassword123!';

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
    const ts = Date.now();

    // 1. Roles & Permissions Setup
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: { rank: 1 },
      create: { name: 'SUPER_ADMIN', rank: 1 },
    });
    const bmRole = await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: { rank: 5 },
      create: { name: 'BRANCH_MANAGER', rank: 5 },
    });
    const salesRole = await prisma.role.upsert({
      where: { name: 'SALES_EMPLOYEE' },
      update: { rank: 7 },
      create: { name: 'SALES_EMPLOYEE', rank: 7 },
    });
    const mechanicRole = await prisma.role.upsert({
      where: { name: 'MECHANIC' },
      update: { rank: 7 },
      create: { name: 'MECHANIC', rank: 7 },
    });

    // 2. Setup Franchise & Two Branches
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-P2-${ts}`,
        name: `Phase 2 Franchise ${ts}`,
        status: 'ACTIVE',
      },
    });
    franchiseId = franchise.id;

    const branchA = await prisma.branch.create({
      data: {
        franchiseId: franchise.id,
        code: `BR-P2A-${ts}`,
        name: `Branch Alpha ${ts}`,
        status: 'ACTIVE',
      },
    });
    branchAId = branchA.id;

    const branchB = await prisma.branch.create({
      data: {
        franchiseId: franchise.id,
        code: `BR-P2B-${ts}`,
        name: `Branch Beta ${ts}`,
        status: 'ACTIVE',
      },
    });
    branchBId = branchB.id;

    // 3. Super Admin
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-p2-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    superAdminUserId = adminUser.id;
    await prisma.employee.create({
      data: {
        userId: adminUser.id,
        branchId: branchAId,
        employeeCode: `EMP-ADM-P2-${ts}`,
        firstName: 'Super',
        lastName: 'Admin',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: superAdminRole.id } },
      },
    });

    // 4. Branch Manager 1 for Branch A
    const bmA1User = await prisma.user.create({
      data: {
        email: `bma1-p2-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    bmA1UserId = bmA1User.id;
    const bmA1Emp = await prisma.employee.create({
      data: {
        userId: bmA1User.id,
        branchId: branchAId,
        employeeCode: `EMP-BMA1-${ts}`,
        firstName: 'Manager',
        lastName: 'AlphaOne',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });
    bmA1EmpId = bmA1Emp.id;

    // 5. Branch Manager 2 for Branch A (Making 2 active Branch Managers in Branch A)
    const bmA2User = await prisma.user.create({
      data: {
        email: `bma2-p2-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    bmA2UserId = bmA2User.id;
    const bmA2Emp = await prisma.employee.create({
      data: {
        userId: bmA2User.id,
        branchId: branchAId,
        employeeCode: `EMP-BMA2-${ts}`,
        firstName: 'Manager',
        lastName: 'AlphaTwo',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });
    bmA2EmpId = bmA2Emp.id;

    // 6. Branch Manager 1 for Branch B
    const bmB1User = await prisma.user.create({
      data: {
        email: `bmb1-p2-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    bmB1UserId = bmB1User.id;
    const bmB1Emp = await prisma.employee.create({
      data: {
        userId: bmB1User.id,
        branchId: branchBId,
        employeeCode: `EMP-BMB1-${ts}`,
        firstName: 'Manager',
        lastName: 'BetaOne',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });
    bmB1EmpId = bmB1Emp.id;

    // 7. Mechanic in Branch A
    const mechUser = await prisma.user.create({
      data: {
        email: `mech-p2-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    mechanicUserId = mechUser.id;
    const mechEmp = await prisma.employee.create({
      data: {
        userId: mechUser.id,
        branchId: branchAId,
        employeeCode: `EMP-MECH-P2-${ts}`,
        firstName: 'Mechanic',
        lastName: 'Mike',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: mechanicRole.id } },
      },
    });
    mechanicEmpId = mechEmp.id;

    // 8. Multi-role Employee in Branch A (starts as SALES_EMPLOYEE)
    const multiUser = await prisma.user.create({
      data: {
        email: `multirole-p2-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    multiRoleUserId = multiUser.id;
    const multiEmp = await prisma.employee.create({
      data: {
        userId: multiUser.id,
        branchId: branchAId,
        employeeCode: `EMP-MULTI-P2-${ts}`,
        firstName: 'Multi',
        lastName: 'Talented',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: salesRole.id } },
      },
    });
    multiRoleEmployeeId = multiEmp.id;

    // Login users to acquire JWT tokens
    const adminRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: adminUser.email, password: testPassword });
    superAdminToken = adminRes.body.data.accessToken;

    const bmA1Res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: bmA1User.email, password: testPassword });
    bmA1Token = bmA1Res.body.data.accessToken;

    const bmA2Res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: bmA2User.email, password: testPassword });
    bmA2Token = bmA2Res.body.data.accessToken;

    const bmB1Res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: bmB1User.email, password: testPassword });
    bmB1Token = bmB1Res.body.data.accessToken;

    const mechRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: mechUser.email, password: testPassword });
    mechanicToken = mechRes.body.data.accessToken;

    const multiRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: multiUser.email, password: testPassword });
    multiRoleToken = multiRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Multiple Roles on Single Employee
  it('1. Should allow assigning multiple roles in the same branch without duplicate user accounts', async () => {
    // Branch Manager A1 assigns additional role MECHANIC to Multi-role employee
    const assignRes = await request(app.getHttpServer())
      .post(`/api/v1/employees/${multiRoleEmployeeId}/roles`)
      .set('Authorization', `Bearer ${bmA1Token}`)
      .send({ roleName: 'MECHANIC' });

    expect(assignRes.status).toBe(201);
    const assignData = assignRes.body.data || assignRes.body;
    const rolesAssigned = assignData.roleAssignments.map((ra: any) => ra.role.name);
    expect(rolesAssigned).toContain('SALES_EMPLOYEE');
    expect(rolesAssigned).toContain('MECHANIC');

    // Verify there is still only ONE user record for this employee
    const userCount = await prisma.user.count({ where: { id: multiRoleUserId } });
    expect(userCount).toBe(1);
    const empInDb = await prisma.employee.findUnique({
      where: { id: multiRoleEmployeeId },
      include: { roleAssignments: { include: { role: true } } },
    });
    expect(empInDb?.roleAssignments.length).toBe(2);

    // Verify /auth/me returns combined roles on single account
    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${multiRoleToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.roles).toContain('SALES_EMPLOYEE');
    expect(meRes.body.data.user.roles).toContain('MECHANIC');
  });

  // TEST 2: Role Escalation Prevention
  it('2. Should prevent role escalation: same-level creation, higher rank creation, and normal employee creation', async () => {
    // A. Branch Manager (rank 5) attempting to create another Branch Manager (rank 5) -> 403 (same-level)
    const sameLevelRes = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${bmA1Token}`)
      .send({
        email: `samelevel-${Date.now()}@titanauto.com`,
        password: 'Password123!',
        firstName: 'Peer',
        lastName: 'Manager',
        branchId: branchAId,
        employeeCode: `EMP-SAME-${Date.now()}`,
        roleName: 'BRANCH_MANAGER',
      });
    expect(sameLevelRes.status).toBe(403);
    expect(sameLevelRes.body.message).toContain('equal or higher authority');

    // B. Branch Manager (rank 5) attempting to create Super Admin (rank 1) -> 403
    const higherRankRes = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${bmA1Token}`)
      .send({
        email: `higher-${Date.now()}@titanauto.com`,
        password: 'Password123!',
        firstName: 'Root',
        lastName: 'Admin',
        branchId: branchAId,
        employeeCode: `EMP-ROOT-${Date.now()}`,
        roleName: 'SUPER_ADMIN',
      });
    expect(higherRankRes.status).toBe(403);

    // C. Normal employee (Mechanic, rank 7) attempting to create an employee -> 403
    const employeeCreateRes = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${mechanicToken}`)
      .send({
        email: `subemp-${Date.now()}@titanauto.com`,
        password: 'Password123!',
        firstName: 'Apprentice',
        lastName: 'Mechanic',
        branchId: branchAId,
        employeeCode: `EMP-APP-${Date.now()}`,
        roleName: 'MECHANIC',
      });
    expect(employeeCreateRes.status).toBe(403);
  });

  // TEST 3: Transactional Maximum 2 Branch Managers Limit
  it('3. Should transactionally enforce maximum 2 active Branch Managers per branch', async () => {
    // Branch A already has bmA1 and bmA2 (2 active Branch Managers).
    // Super Admin attempting to create a 3rd Branch Manager in Branch A must be rejected transactionally.
    const createThirdRes = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: `bm-third-${Date.now()}@titanauto.com`,
        password: 'Password123!',
        firstName: 'Third',
        lastName: 'Manager',
        branchId: branchAId,
        employeeCode: `EMP-BM3-${Date.now()}`,
        roleName: 'BRANCH_MANAGER',
      });

    expect(createThirdRes.status).toBe(400);
    expect(createThirdRes.body.message).toContain('A branch cannot have more than 2 active Branch Managers');

    // Super Admin attempting to assign BRANCH_MANAGER role to an existing employee in Branch A must also fail
    const assignBmRes = await request(app.getHttpServer())
      .post(`/api/v1/employees/${mechanicEmpId}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ roleName: 'BRANCH_MANAGER' });

    expect(assignBmRes.status).toBe(400);
    expect(assignBmRes.body.message).toContain('A branch cannot have more than 2 active Branch Managers');
  });

  // TEST 4: Approval Scope
  it('4. Should scope employee approval requests to the authorized branch', async () => {
    // Branch Manager B1 creates an employee in Branch B
    const createInBRes = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${bmB1Token}`)
      .send({
        email: `emp-b-scope-${Date.now()}@titanauto.com`,
        password: 'Password123!',
        firstName: 'Beta',
        lastName: 'Worker',
        branchId: branchBId,
        employeeCode: `EMP-B-SCOPE-${Date.now()}`,
        roleName: 'MECHANIC',
      });

    expect(createInBRes.status).toBe(201);
    const approvalRequestId = createInBRes.body.approvalRequestId || createInBRes.body.data?.approvalRequestId;

    // Branch Manager A1 lists pending approvals -> must NOT see Branch B's request
    const bmA1PendingRes = await request(app.getHttpServer())
      .get('/api/v1/employees/approval-requests')
      .set('Authorization', `Bearer ${bmA1Token}`);

    expect(bmA1PendingRes.status).toBe(200);
    const idsVisibleToBmA = (bmA1PendingRes.body.data || []).map((r: any) => r.id);
    expect(idsVisibleToBmA).not.toContain(approvalRequestId);

    // Branch Manager A1 tries to approve Branch B's request directly -> 403
    const crossApproveRes = await request(app.getHttpServer())
      .post(`/api/v1/employees/approval-requests/${approvalRequestId}/approve`)
      .set('Authorization', `Bearer ${bmA1Token}`);

    expect(crossApproveRes.status).toBe(403);
  });

  // TEST 5: Employee Deactivation & Former Employee Record Preservation
  it('5. Should deactivate employee without hard deleting records and preserve historical data', async () => {
    // Create customer and test quotation under bmA2 to record historical activity
    const cust = await prisma.customer.create({
      data: {
        name: `Customer Test ${Date.now()}`,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `cust-hist-${Date.now()}@titanauto.com`,
      },
    });

    const variant = await prisma.truckVariant.findFirst();

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: `QT-HIST-${Date.now()}`,
        customerId: cust.id,
        franchiseId,
        branchId: branchAId,
        salespersonEmployeeId: bmA2EmpId,
        createdByUserId: bmA2UserId,
        variantId: variant!.id,
        unitBasePrice: 2000000,
        subtotal: 2000000,
        gstRate: 28,
        gstAmount: 560000,
        totalAmount: 2560000,
        validityDate: new Date(Date.now() + 86400000),
        status: 'SUBMITTED',
      },
    });

    // Deactivate bmA2
    const deactRes = await request(app.getHttpServer())
      .patch(`/api/v1/employees/${bmA2EmpId}/deactivate`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(deactRes.status).toBe(200);

    // Verify employee and user are INACTIVE, NOT deleted
    const empInDb = await prisma.employee.findUnique({ where: { id: bmA2EmpId } });
    expect(empInDb).toBeDefined();
    expect(empInDb?.status).toBe('INACTIVE');

    const userInDb = await prisma.user.findUnique({ where: { id: bmA2UserId } });
    expect(userInDb?.status).toBe('INACTIVE');

    // Historical quotation still points to the deactivated employee
    const quotInDb = await prisma.quotation.findUnique({ where: { id: quotation.id } });
    expect(quotInDb?.salespersonEmployeeId).toBe(bmA2EmpId);
  });

  // TEST 6: Inactive Employee Cannot Authenticate
  it('6. Inactive employee cannot authenticate via login or existing JWT', async () => {
    const bmA2User = await prisma.user.findUnique({ where: { id: bmA2UserId } });
    // Login attempt with correct password fails with 401
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: bmA2User!.email,
        password: testPassword,
      });

    expect(loginRes.status).toBe(401);

    // Existing JWT token of deactivated employee is rejected
    const apiRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${bmA2Token}`);

    expect(apiRes.status).toBe(401);
  });

  // TEST 7: CurrentUser Mechanic Identity Resolution
  it('7. Should resolve @CurrentUser(employeeId) reliably and return mechanic jobs', async () => {
    // Verify /auth/me returns top-level employeeId
    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${mechanicToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.employeeId).toBe(mechanicEmpId);

    // Create a customer and service job assigned to this mechanic
    const cust = await prisma.customer.create({
      data: {
        name: `Mech Cust ${Date.now()}`,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `mechcust-${Date.now()}@titanauto.com`,
      },
    });

    const variant = await prisma.truckVariant.findFirst();
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: `VIN-MECH-${Date.now()}`,
        engineNumber: `ENG-MECH-${Date.now()}`,
        branchId: branchAId,
        variantId: variant!.id,
        customerId: cust.id,
        status: 'DELIVERED',
        manufacturingYear: 2026,
        baseCost: 1800000,
        sellingPrice: 2000000,
      },
    });

    const job = await prisma.serviceJob.create({
      data: {
        jobNumber: `JOB-MECH-${Date.now()}`,
        customerId: cust.id,
        vehicleId: vehicle.id,
        branchId: branchAId,
        serviceAdvisorId: bmA1EmpId,
        assignedMechanicId: mechanicEmpId,
        complaint: 'Engine oil service',
        status: 'CHECKED_IN',
      },
    });

    // Mechanic queries my-jobs
    const myJobsRes = await request(app.getHttpServer())
      .get('/api/v1/service-jobs/mechanic/my-jobs')
      .set('Authorization', `Bearer ${mechanicToken}`);

    expect(myJobsRes.status).toBe(200);
    const myJobsData = myJobsRes.body.data || myJobsRes.body;
    const jobIds = myJobsData.map((j: any) => j.id);
    expect(jobIds).toContain(job.id);
  });

  // TEST 8: Branch Transfer Prevention
  it('8. Should forbid employee branch transfer during employee update', async () => {
    const transferRes = await request(app.getHttpServer())
      .patch(`/api/v1/employees/${mechanicEmpId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        branchId: branchBId, // Attempting to change branch
        firstName: 'Michael',
      });

    expect(transferRes.status).toBe(403);
    expect(transferRes.body.message).toContain('Branch transfer is not permitted');
  });
});
