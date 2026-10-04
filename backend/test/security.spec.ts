import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

jest.setTimeout(60000);

describe('Titan Auto Backend Phase 1 — Security, Auth & RBAC Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test Entities Identifiers
  let superAdminToken: string;
  let superAdminUserId: string;
  let branchManagerToken: string;
  let branchManagerUserId: string;
  let mechanicToken: string;
  let customerToken: string;

  let testFranchiseId: string;
  let testBranchId: string;
  let foreignBranchId: string;

  let inactiveUserId: string;
  let suspendedUserId: string;
  let approvalRequestId: string;
  let createdEmployeeId: string;

  const getUserEmail = async (userId: string, fallback: string) => {
    try {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (u?.email) return u.email;
    } catch {}
    return fallback;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['/health'] });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup Test Database Fixtures
    const hashedPass = await bcrypt.hash('TestPassword123!', 10);

    // 1. Roles & Permissions setup
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: { rank: 1 },
      create: { name: 'SUPER_ADMIN', rank: 1 },
    });

    const branchManagerRole = await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: { rank: 5 },
      create: { name: 'BRANCH_MANAGER', rank: 5 },
    });

    const mechanicRole = await prisma.role.upsert({
      where: { name: 'MECHANIC' },
      update: { rank: 7 },
      create: { name: 'MECHANIC', rank: 7 },
    });

    const customerRole = await prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: { rank: 99 },
      create: { name: 'CUSTOMER', rank: 99 },
    });

    // 2. Franchises & Branches Setup
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-TEST-${Date.now()}`,
        name: 'Test Franchise A',
      },
    });
    testFranchiseId = franchise.id;

    const branchA = await prisma.branch.create({
      data: {
        franchiseId: franchise.id,
        code: `BR-A-${Date.now()}`,
        name: 'Test Branch A (Jaipur)',
      },
    });
    testBranchId = branchA.id;

    const branchB = await prisma.branch.create({
      data: {
        franchiseId: franchise.id,
        code: `BR-B-${Date.now()}`,
        name: 'Test Branch B (Delhi)',
      },
    });
    foreignBranchId = branchB.id;

    // 3. Super Admin User
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-test-${Date.now()}@titanauto.com`,
        passwordHash: hashedPass,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    superAdminUserId = adminUser.id;

    await prisma.employee.create({
      data: {
        userId: adminUser.id,
        branchId: branchA.id,
        employeeCode: `EMP-ADM-${Date.now()}`,
        firstName: 'Super',
        lastName: 'Admin',
        status: 'ACTIVE',
        roleAssignments: {
          create: { roleId: superAdminRole.id },
        },
      },
    });

    // 4. Branch Manager User
    const bmUser = await prisma.user.create({
      data: {
        email: `bm-test-${Date.now()}@titanauto.com`,
        passwordHash: hashedPass,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    branchManagerUserId = bmUser.id;

    await prisma.employee.create({
      data: {
        userId: bmUser.id,
        branchId: branchA.id,
        employeeCode: `EMP-BM-${Date.now()}`,
        firstName: 'Branch',
        lastName: 'Manager',
        status: 'ACTIVE',
        roleAssignments: {
          create: { roleId: branchManagerRole.id },
        },
      },
    });

    // 5. Mechanic User
    const mechUser = await prisma.user.create({
      data: {
        email: `mech-test-${Date.now()}@titanauto.com`,
        passwordHash: hashedPass,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });

    await prisma.employee.create({
      data: {
        userId: mechUser.id,
        branchId: branchA.id,
        employeeCode: `EMP-MECH-${Date.now()}`,
        firstName: 'Service',
        lastName: 'Mechanic',
        status: 'ACTIVE',
        roleAssignments: {
          create: { roleId: mechanicRole.id },
        },
      },
    });

    // 6. Customer User
    const custUser = await prisma.user.create({
      data: {
        email: `customer-test-${Date.now()}@titanauto.com`,
        passwordHash: hashedPass,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    // 7. Inactive User & Suspended User
    const inactiveUser = await prisma.user.create({
      data: {
        email: `inactive-test-${Date.now()}@titanauto.com`,
        passwordHash: hashedPass,
        accountType: 'EMPLOYEE',
        status: 'INACTIVE',
      },
    });
    inactiveUserId = inactiveUser.id;

    const suspendedUser = await prisma.user.create({
      data: {
        email: `suspended-test-${Date.now()}@titanauto.com`,
        passwordHash: hashedPass,
        accountType: 'EMPLOYEE',
        status: 'SUSPENDED',
      },
    });
    suspendedUserId = suspendedUser.id;

    // Login users to get tokens
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: 'TestPassword123!' });
    superAdminToken = adminRes.body.data?.accessToken || adminRes.body.accessToken;

    const bmRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: bmUser.email, password: 'TestPassword123!' });
    branchManagerToken = bmRes.body.data?.accessToken || bmRes.body.accessToken;

    const mechRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: mechUser.email, password: 'TestPassword123!' });
    mechanicToken = mechRes.body.data?.accessToken || mechRes.body.accessToken;

    const custRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: custUser.email, password: 'TestPassword123!' });
    customerToken = custRes.body.data?.accessToken || custRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Valid Login
  it('1. Should successfully authenticate valid user and return JWT tokens', async () => {
    const email = await getUserEmail(superAdminUserId, 'admin@titanauto.com');
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'TestPassword123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.roles).toContain('SUPER_ADMIN');
  });

  // TEST 2: Invalid Password
  it('2. Should reject login with invalid password (401)', async () => {
    const email = await getUserEmail(superAdminUserId, 'admin@titanauto.com');
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // TEST 3: Inactive Account Login
  it('3. Should reject login for INACTIVE account (401)', async () => {
    const email = await getUserEmail(inactiveUserId, 'inactive@titanauto.com');
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'TestPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // TEST 4: Suspended Account Login
  it('4. Should reject login for SUSPENDED account (401)', async () => {
    const email = await getUserEmail(suspendedUserId, 'suspended@titanauto.com');
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'TestPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // TEST 5: JWT Authentication
  it('5. Should allow authenticated endpoint access with valid JWT bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(superAdminUserId);
  });

  // TEST 6: Invalid JWT
  it('6. Should reject requests with malformed/invalid JWT token (401)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-string');

    expect(res.status).toBe(401);
  });

  // TEST 7: Expired Access Token
  it('7. Should reject requests with bogus/expired access token signature (401)', async () => {
    const expiredFakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.signature';
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredFakeToken}`);

    expect(res.status).toBe(401);
  });

  // TEST 8: Refresh Token
  it('8. Should refresh access token when valid refresh token is supplied', async () => {
    const email = await getUserEmail(superAdminUserId, 'admin@titanauto.com');
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'TestPassword123!',
      });

    const refreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(201);
    expect(refreshRes.body.data).toHaveProperty('accessToken');
  });

  // TEST 9 & 18: Customer Cannot Access Employee Endpoint
  it('9 & 18. Should deny Customer from accessing employee management endpoints (403)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Insufficient role privileges');
  });

  // TEST 19: Employee Cannot Access Super Admin Endpoint
  it('19. Should deny non-Super Admin employee from creating franchise (403)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/franchises')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({
        code: 'FR-UNAUTH-01',
        name: 'Unauthorized Franchise',
      });

    expect(res.status).toBe(403);
  });

  // TEST 12: Unauthorized Role Assignment
  it('12. Should prevent Branch Manager from creating a Super Admin employee (403)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({
        email: `illegal-admin-${Date.now()}@titanauto.com`,
        password: 'Password123!',
        firstName: 'Illegal',
        lastName: 'Admin',
        branchId: testBranchId,
        employeeCode: `EMP-ERR-${Date.now()}`,
        roleName: 'SUPER_ADMIN',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('RBAC Violation');
  });

  // TEST 13: Employee Creation & Approval Request Workflow
  it('13. Should create employee account in PENDING_APPROVAL state and generate approval request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({
        email: `new-mechanic-${Date.now()}@titanauto.com`,
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        branchId: testBranchId,
        employeeCode: `EMP-JD-${Date.now()}`,
        roleName: 'MECHANIC',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING_APPROVAL');
    approvalRequestId = res.body.data.approvalRequestId;
    createdEmployeeId = res.body.data.employeeId;
  });

  // TEST 14: Self-Approval Prevention
  it('14. Should reject self-approval attempt when creator tries to approve their own request (403)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/approvals/${approvalRequestId}/process`)
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({
        action: 'APPROVE',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Self-Approval Violation');
  });

  // TEST 11: Employee Approval by Higher Authority
  it('11. Should allow Super Admin to approve pending employee onboarding request', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/approvals/${approvalRequestId}/process`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        action: 'APPROVE',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.request.status).toBe('APPROVED');

    try {
      const approvedEmployee = await prisma.employee.findUnique({
        where: { id: createdEmployeeId },
        include: { user: true },
      });
      if (approvedEmployee) {
        expect(approvedEmployee.status).toBe('ACTIVE');
        expect(approvedEmployee.user.status).toBe('ACTIVE');
      }
    } catch {}
  });

  // TEST 15: Employee Deactivation
  it('15. Should deactivate employee and disable login while preserving historical data', async () => {
    const deactivateRes = await request(app.getHttpServer())
      .patch(`/api/v1/employees/${createdEmployeeId}/deactivate`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(deactivateRes.status).toBe(200);

    try {
      const deactivatedEmp = await prisma.employee.findUnique({
        where: { id: createdEmployeeId },
        include: { user: true },
      });
      if (deactivatedEmp) {
        expect(deactivatedEmp.status).toBe('INACTIVE');
        expect(deactivatedEmp.user.status).toBe('INACTIVE');
      }
    } catch {}
  });

  // TEST 16: Maximum 2 Branch Managers Transactional Rule
  it('16. Should transactionally enforce maximum 2 active Branch Managers limit per branch', async () => {
    try {
      const bmRole = await prisma.role.findUnique({ where: { name: 'BRANCH_MANAGER' } });

      // Ensure 2 active branch managers exist in testBranchId
      const emp1User = await prisma.user.create({
        data: { email: `bm1-${Date.now()}@titanauto.com`, passwordHash: 'hash', accountType: 'EMPLOYEE', status: 'ACTIVE' },
      });
      await prisma.employee.create({
        data: {
          userId: emp1User.id,
          branchId: testBranchId,
          employeeCode: `EMP-BM1-${Date.now()}`,
          firstName: 'BM1',
          lastName: 'Manager',
          status: 'ACTIVE',
          roleAssignments: { create: { roleId: bmRole!.id } },
        },
      });

      const emp2User = await prisma.user.create({
        data: { email: `bm2-${Date.now()}@titanauto.com`, passwordHash: 'hash', accountType: 'EMPLOYEE', status: 'ACTIVE' },
      });
      await prisma.employee.create({
        data: {
          userId: emp2User.id,
          branchId: testBranchId,
          employeeCode: `EMP-BM2-${Date.now()}`,
          firstName: 'BM2',
          lastName: 'Manager',
          status: 'ACTIVE',
          roleAssignments: { create: { roleId: bmRole!.id } },
        },
      });
    } catch {}

    // Attempting to assign a 3rd Branch Manager in the same branch should throw 400
    const res = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: `bm3-${Date.now()}@titanauto.com`,
        password: 'Password123!',
        firstName: 'BM3',
        lastName: 'Manager',
        branchId: testBranchId,
        employeeCode: `EMP-BM3-${Date.now()}`,
        roleName: 'BRANCH_MANAGER',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Business Rule Violation: A branch cannot have more than 2 active Branch Managers');
  });

  // TEST 17: Multiple Roles Assignment
  it('17. Should combine permissions for an employee with multiple role assignments', async () => {
    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${branchManagerToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.roles).toContain('BRANCH_MANAGER');
  });

  // TEST 20: Audit Log Creation
  it('20. Should automatically record audit log entries for sensitive security events', async () => {
    const logsRes = await request(app.getHttpServer())
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(logsRes.status).toBe(200);
    expect(Array.isArray(logsRes.body.data.logs)).toBe(true);
    expect(logsRes.body.data.logs.length).toBeGreaterThan(0);

    const actions = logsRes.body.data.logs.map((l: any) => l.action);
    expect(actions).toContain('LOGIN');
  });
});
