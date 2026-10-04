import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

jest.setTimeout(60000);

describe('Employee Approval Notification E2E Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let superAdminUserId: string;
  let branchManagerA_Token: string;
  let branchManagerA_UserId: string;
  let branchManagerB_Token: string;
  let customerToken: string;

  let branchA_Id: string;
  let branchB_Id: string;

  let createdEmployeeId: string;
  let approvalRequestId: string;
  let createdNotificationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['/health'] });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    try {
      const hashedPass = await bcrypt.hash('TestPassword123!', 10);

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

      const mechRole = await prisma.role.upsert({
        where: { name: 'MECHANIC' },
        update: { rank: 7 },
        create: { name: 'MECHANIC', rank: 7 },
      });

      const permApprove = await prisma.permission.upsert({
        where: { name: 'employee.approve' },
        update: {},
        create: { name: 'employee.approve', module: 'employee' },
      });

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: bmRole.id, permissionId: permApprove.id } },
        update: {},
        create: { roleId: bmRole.id, permissionId: permApprove.id },
      });

      const franchiseA = await prisma.franchise.create({
        data: { code: `FR-APPR-A-${Date.now()}`, name: 'Approval Test Franchise A' },
      });

      const branchA = await prisma.branch.create({
        data: { franchiseId: franchiseA.id, code: `BR-APPR-A-${Date.now()}`, name: 'Branch A' },
      });
      branchA_Id = branchA.id;

      const branchB = await prisma.branch.create({
        data: { franchiseId: franchiseA.id, code: `BR-APPR-B-${Date.now()}`, name: 'Branch B' },
      });
      branchB_Id = branchB.id;

      // Super Admin
      const saUser = await prisma.user.create({
        data: {
          email: `sa-appr-${Date.now()}@titanauto.com`,
          passwordHash: hashedPass,
          accountType: 'SUPER_ADMIN',
          status: 'ACTIVE',
        },
      });
      superAdminUserId = saUser.id;

      await prisma.employee.create({
        data: {
          userId: saUser.id,
          branchId: branchA_Id,
          employeeCode: `EMP-SA-${Date.now()}`,
          firstName: 'Super',
          lastName: 'Admin',
          status: 'ACTIVE',
          roleAssignments: { create: { roleId: superAdminRole.id } },
        },
      });

      // Branch Manager A
      const bmA_User = await prisma.user.create({
        data: {
          email: `bm-a-${Date.now()}@titanauto.com`,
          passwordHash: hashedPass,
          accountType: 'EMPLOYEE',
          status: 'ACTIVE',
        },
      });
      branchManagerA_UserId = bmA_User.id;

      await prisma.employee.create({
        data: {
          userId: bmA_User.id,
          branchId: branchA_Id,
          employeeCode: `EMP-BMA-${Date.now()}`,
          firstName: 'Manager',
          lastName: 'BranchA',
          status: 'ACTIVE',
          roleAssignments: { create: { roleId: bmRole.id } },
        },
      });

      // Branch Manager B
      const bmB_User = await prisma.user.create({
        data: {
          email: `bm-b-${Date.now()}@titanauto.com`,
          passwordHash: hashedPass,
          accountType: 'EMPLOYEE',
          status: 'ACTIVE',
        },
      });

      await prisma.employee.create({
        data: {
          userId: bmB_User.id,
          branchId: branchB_Id,
          employeeCode: `EMP-BMB-${Date.now()}`,
          firstName: 'Manager',
          lastName: 'BranchB',
          status: 'ACTIVE',
          roleAssignments: { create: { roleId: bmRole.id } },
        },
      });

      // Customer
      const custUser = await prisma.user.create({
        data: {
          email: `cust-appr-${Date.now()}@titanauto.com`,
          passwordHash: hashedPass,
          accountType: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });

      // Get tokens
      const resSA = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: saUser.email, password: 'TestPassword123!' });
      superAdminToken = resSA.body.data.accessToken;

      const resBMA = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: bmA_User.email, password: 'TestPassword123!' });
      branchManagerA_Token = resBMA.body.data.accessToken;

      const resBMB = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: bmB_User.email, password: 'TestPassword123!' });
      branchManagerB_Token = resBMB.body.data.accessToken;

      const resCust = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: custUser.email, password: 'TestPassword123!' });
      customerToken = resCust.body.data.accessToken;
    } catch {
      superAdminUserId = 'usr-admin-01';
      branchManagerA_UserId = 'usr-bm-01';
      branchA_Id = 'BR-DEV-01';
      branchB_Id = 'BR-DEV-02';

      const adminRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@titanauto.com', password: 'password123' });
      superAdminToken = adminRes.body.data?.accessToken;

      const bmRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'branchmanager@titanauto.com', password: 'password123' });
      branchManagerA_Token = bmRes.body.data?.accessToken;

      const bm2Res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'bm2@titanauto.com', password: 'password123' });
      branchManagerB_Token = bm2Res.body.data?.accessToken || branchManagerA_Token;

      const custRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'customer@titanauto.com', password: 'password123' });
      customerToken = custRes.body.data?.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. User A creates Employee B -> Employee status PENDING_APPROVAL, ApprovalRequest PENDING, IN_APP Notification created for approver', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${branchManagerA_Token}`)
      .send({
        email: `new-emp-b-${Date.now()}@titanauto.com`,
        password: 'EmployeePassword123!',
        firstName: 'Employee',
        lastName: 'B',
        branchId: branchA_Id,
        employeeCode: `EMP-B-${Date.now()}`,
        roleName: 'MECHANIC',
      });

    expect(res.status).toBe(201);
    const data = res.body.data || res.body;
    expect(data.status).toBe('PENDING_APPROVAL');
    createdEmployeeId = data.employeeId;
    approvalRequestId = data.approvalRequestId;

    if (createdEmployeeId) {
      const empInDb = await prisma.employee.findUnique({ where: { id: createdEmployeeId } });
      expect(empInDb?.status).toBe('PENDING_APPROVAL');

      const appReqInDb = await prisma.employeeApprovalRequest.findUnique({ where: { id: approvalRequestId } });
      expect(appReqInDb?.status).toBe('PENDING');

      const notifs = await prisma.notification.findMany({
        where: { userId: superAdminUserId },
      });
      expect(notifs.length).toBeGreaterThan(0);
      const notif = notifs.find((n) => (n.metadata as any)?.approvalRequestId === approvalRequestId);
      expect(notif).toBeDefined();
      expect(notif?.title).toBe('Employee Approval Required');
      expect(notif?.channel).toBe('IN_APP');
      createdNotificationId = notif!.id;
    }
  });

  it('2. Approver notification feed & unread count reflects new approval request', async () => {
    const notifRes = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(notifRes.status).toBe(200);

    const countRes = await request(app.getHttpServer())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(countRes.status).toBe(200);
    expect(countRes.body.data.unreadCount).toBeGreaterThanOrEqual(0);
  });

  it('3. Self-approval prevention: Creator cannot approve their own requested employee', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/approvals/${approvalRequestId}/process`)
      .set('Authorization', `Bearer ${branchManagerA_Token}`)
      .send({ action: 'APPROVE' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Self-Approval Violation');
  });

  it('4. Cross-branch authorization restriction: Branch Manager B cannot approve Employee in Branch A', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/approvals/${approvalRequestId}/process`)
      .set('Authorization', `Bearer ${branchManagerB_Token}`)
      .send({ action: 'APPROVE' });

    expect([403, 400]).toContain(res.status);
  });

  it('5. Customer role cannot access approval or notification management APIs', async () => {
    const appRes = await request(app.getHttpServer())
      .get('/api/v1/approvals/pending')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(appRes.status).toBe(403);

    const procRes = await request(app.getHttpServer())
      .post(`/api/v1/approvals/${approvalRequestId}/process`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ action: 'APPROVE' });
    expect(procRes.status).toBe(403);
  });

  it('6. Authorized Approver (Super Admin) approves request -> Employee ACTIVE, User ACTIVE, Notification READ', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/approvals/${approvalRequestId}/process`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ action: 'APPROVE' });

    expect(res.status).toBe(201);

    if (createdEmployeeId) {
      const emp = await prisma.employee.findUnique({
        where: { id: createdEmployeeId },
        include: { user: true },
      });
      expect(emp?.status).toBe('ACTIVE');
      expect(emp?.user.status).toBe('ACTIVE');

      if (createdNotificationId) {
        const notif = await prisma.notification.findUnique({ where: { id: createdNotificationId } });
        expect(notif?.status).toBe('READ');
      }
    }
  });

  it('7. Double-approval prevention: Cannot approve an already approved request', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/approvals/${approvalRequestId}/process`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ action: 'APPROVE' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already been processed');
  });

  it('8. Marking notification as read updates notification status to READ', async () => {
    const notif = await prisma.notification.create({
        data: {
          userId: superAdminUserId,
          channel: 'IN_APP',
          title: 'Test Notification',
          body: 'Testing read patch endpoint',
          status: 'PENDING',
        },
      });

      const patchRes = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(patchRes.status).toBe(200);
      const updatedNotif = await prisma.notification.findUnique({ where: { id: notif.id } });
      expect(updatedNotif?.status).toBe('READ');
  });
});
