import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

jest.setTimeout(60000);

describe('Phase 1 Focused Security, Multi-Tenant Isolation & Customer Authorization Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens
  let superAdminToken: string;
  let franchiseOwner1Token: string;
  let branchManager1Token: string;
  let branchManager2Token: string;
  let customer1Token: string;
  let customer2Token: string;

  // Entities
  let franchise1Id: string;
  let franchise2Id: string;
  let branch1AId: string;
  let branch2AId: string;
  let customer1Id: string;
  let customer2Id: string;
  let adminEmail: string;
  let approvalBranch2Id: string;
  let vehicleStockBranch1Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['/health'] });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const testPassword = 'ActualStoredSecurePassword123!';
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const timestamp = Date.now();

    // 1. Roles
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: { rank: 1 },
      create: { name: 'SUPER_ADMIN', rank: 1 },
    });
    const foRole = await prisma.role.upsert({
      where: { name: 'FRANCHISE_OWNER' },
      update: { rank: 3 },
      create: { name: 'FRANCHISE_OWNER', rank: 3 },
    });
    const bmRole = await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: { rank: 5 },
      create: { name: 'BRANCH_MANAGER', rank: 5 },
    });
    const customerRole = await prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: { rank: 99 },
      create: { name: 'CUSTOMER', rank: 99 },
    });

    // 2. Franchises
    const franchise1 = await prisma.franchise.create({
      data: {
        code: `FR-1-${timestamp}`,
        name: `Franchise North ${timestamp}`,
        status: 'ACTIVE',
      },
    });
    franchise1Id = franchise1.id;

    const franchise2 = await prisma.franchise.create({
      data: {
        code: `FR-2-${timestamp}`,
        name: `Franchise South ${timestamp}`,
        status: 'ACTIVE',
      },
    });
    franchise2Id = franchise2.id;

    // 3. Branches
    const branch1A = await prisma.branch.create({
      data: {
        franchiseId: franchise1Id,
        code: `BR-1A-${timestamp}`,
        name: `Branch Delhi ${timestamp}`,
        status: 'ACTIVE',
      },
    });
    branch1AId = branch1A.id;

    const branch2A = await prisma.branch.create({
      data: {
        franchiseId: franchise2Id,
        code: `BR-2A-${timestamp}`,
        name: `Branch Mumbai ${timestamp}`,
        status: 'ACTIVE',
      },
    });
    branch2AId = branch2A.id;

    // 4. Super Admin
    adminEmail = `admin-p1-${timestamp}@titanauto.com`;
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    await prisma.employee.create({
      data: {
        userId: adminUser.id,
        branchId: branch1AId,
        employeeCode: `EMP-ADM-${timestamp}`,
        firstName: 'Super',
        lastName: 'Admin',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: superAdminRole.id } },
      },
    });

    // 5. Franchise Owner 1
    const fo1Email = `fo1-p1-${timestamp}@titanauto.com`;
    const fo1User = await prisma.user.create({
      data: {
        email: fo1Email,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    await prisma.employee.create({
      data: {
        userId: fo1User.id,
        branchId: branch1AId,
        employeeCode: `EMP-FO1-${timestamp}`,
        firstName: 'Franchise',
        lastName: 'Owner1',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: foRole.id } },
      },
    });

    // 6. Branch Manager 1 (Branch 1A)
    const bm1Email = `bm1-p1-${timestamp}@titanauto.com`;
    const bm1User = await prisma.user.create({
      data: {
        email: bm1Email,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    await prisma.employee.create({
      data: {
        userId: bm1User.id,
        branchId: branch1AId,
        employeeCode: `EMP-BM1-${timestamp}`,
        firstName: 'Branch',
        lastName: 'Manager1',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });

    // 7. Branch Manager 2 (Branch 2A)
    const bm2Email = `bm2-p1-${timestamp}@titanauto.com`;
    const bm2User = await prisma.user.create({
      data: {
        email: bm2Email,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    await prisma.employee.create({
      data: {
        userId: bm2User.id,
        branchId: branch2AId,
        employeeCode: `EMP-BM2-${timestamp}`,
        firstName: 'Branch',
        lastName: 'Manager2',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });

    // 8. Customers
    const cust1Email = `cust1-p1-${timestamp}@titanauto.com`;
    const cust1User = await prisma.user.create({
      data: {
        email: cust1Email,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    const cust1 = await prisma.customer.create({
      data: {
        userId: cust1User.id,
        name: 'Customer One',
        customerType: 'INDIVIDUAL',
        email: cust1Email,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
      },
    });
    customer1Id = cust1.id;

    const cust2Email = `cust2-p1-${timestamp}@titanauto.com`;
    const cust2User = await prisma.user.create({
      data: {
        email: cust2Email,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    const cust2 = await prisma.customer.create({
      data: {
        userId: cust2User.id,
        name: 'Customer Two',
        customerType: 'INDIVIDUAL',
        email: cust2Email,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
      },
    });
    customer2Id = cust2.id;

    // Vehicle in Stock Branch 1A
    let variant = await prisma.truckVariant.findFirst();
    if (!variant) {
      const mfr = await prisma.manufacturer.create({ data: { name: `MFR-${timestamp}`, country: 'India' } });
      const model = await prisma.truckModel.create({ data: { manufacturerId: mfr.id, name: `Model-${timestamp}`, category: 'HAULAGE' } });
      variant = await prisma.truckVariant.create({
        data: {
          modelId: model.id,
          name: `Variant Standard ${timestamp}`,
          basePrice: 2000000,
        },
      });
    }

    const vehicleStock = await prisma.vehicle.create({
      data: {
        vin: `VIN-P1-${timestamp}`,
        engineNumber: `ENG-${timestamp}`,
        branchId: branch1AId,
        variantId: variant.id,
        status: 'IN_STOCK',
        manufacturingYear: 2026,
        baseCost: 1800000,
        sellingPrice: 2000000,
      },
    });
    vehicleStockBranch1Id = vehicleStock.id;

    // Login each user
    const resAdmin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: adminEmail, password: testPassword });
    superAdminToken = resAdmin.body.data.accessToken;

    const resFo1 = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: fo1Email, password: testPassword });
    franchiseOwner1Token = resFo1.body.data.accessToken;

    const resBm1 = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: bm1Email, password: testPassword });
    branchManager1Token = resBm1.body.data.accessToken;

    const resBm2 = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: bm2Email, password: testPassword });
    branchManager2Token = resBm2.body.data.accessToken;

    const resCust1 = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: cust1Email, password: testPassword });
    customer1Token = resCust1.body.data.accessToken;

    const resCust2 = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: cust2Email, password: testPassword });
    customer2Token = resCust2.body.data.accessToken;

    // Create an approval request under Branch 2A via BM2 creating an employee
    const empInBranch2Res = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${branchManager2Token}`)
      .send({
        email: `emp-branch2-${timestamp}@titanauto.com`,
        password: 'Password123!',
        firstName: 'Branch2',
        lastName: 'Mechanic',
        branchId: branch2AId,
        employeeCode: `EMP-B2-${timestamp}`,
        roleName: 'MECHANIC',
      });
    approvalBranch2Id = empInBranch2Res.body.data?.approvalRequestId || empInBranch2Res.body?.approvalRequestId;
  });

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Super Admin can access all branches
  it('1. Super Admin can access all branches', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/branches')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    const branchIds = res.body.data.map((b: any) => b.id);
    expect(branchIds).toContain(branch1AId);
    expect(branchIds).toContain(branch2AId);

    const singleRes = await request(app.getHttpServer())
      .get(`/api/v1/branches/${branch2AId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(singleRes.status).toBe(200);
    expect(singleRes.body.data.id).toBe(branch2AId);
  });

  // TEST 2: Franchise Owner cannot access unrelated franchise
  it('2. Franchise Owner cannot access unrelated franchise', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/franchises/${franchise2Id}`)
      .set('Authorization', `Bearer ${franchiseOwner1Token}`);

    expect([403, 404]).toContain(res.status);

    // Should access own franchise
    const ownRes = await request(app.getHttpServer())
      .get(`/api/v1/franchises/${franchise1Id}`)
      .set('Authorization', `Bearer ${franchiseOwner1Token}`);
    expect(ownRes.status).toBe(200);
  });

  // TEST 3: Branch Manager cannot access another branch
  it('3. Branch Manager cannot access another branch', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/branches/${branch2AId}`)
      .set('Authorization', `Bearer ${branchManager1Token}`);

    expect([403, 404]).toContain(res.status);

    // Should access own branch
    const ownRes = await request(app.getHttpServer())
      .get(`/api/v1/branches/${branch1AId}`)
      .set('Authorization', `Bearer ${branchManager1Token}`);
    expect(ownRes.status).toBe(200);
  });

  // TEST 4: Branch Manager cannot create employee in another branch
  it('4. Branch Manager cannot create employee in another branch', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${branchManager1Token}`)
      .send({
        email: `intruder-${Date.now()}@titanauto.com`,
        password: 'Password123!',
        firstName: 'Intruder',
        lastName: 'Employee',
        branchId: branch2AId, // foreign branch!
        employeeCode: `EMP-INT-${Date.now()}`,
        roleName: 'SALES_EMPLOYEE',
      });

    expect(res.status).toBe(403);
  });

  // TEST 5: Branch Manager cannot see another branch approval requests
  it('5. Branch Manager cannot see another branch approval requests', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/approvals/pending')
      .set('Authorization', `Bearer ${branchManager1Token}`);

    expect(listRes.status).toBe(200);
    const pendingIds = (listRes.body.data || []).map((a: any) => a.id);
    expect(pendingIds).not.toContain(approvalBranch2Id);

    // Direct access to another branch's approval request
    const singleRes = await request(app.getHttpServer())
      .get(`/api/v1/approvals/${approvalBranch2Id}`)
      .set('Authorization', `Bearer ${branchManager1Token}`);

    expect([403, 404]).toContain(singleRes.status);
  });

  // TEST 6: Customer cannot access another customer
  it('6. Customer cannot access another customer profile or data', async () => {
    // Customer 1 tries to access Customer 2 profile
    const res = await request(app.getHttpServer())
      .get(`/api/v1/customers/${customer2Id}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect([403, 404]).toContain(res.status);

    // Customer 1 tries to enumerate all customers
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(listRes.status).toBe(403);

    // Customer 1 accessing own profile succeeds
    const ownRes = await request(app.getHttpServer())
      .get(`/api/v1/customers/${customer1Id}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(ownRes.status).toBe(200);
    expect(ownRes.body.data.id).toBe(customer1Id);
  });

  // TEST 7: Customer cannot access dealership-wide vehicles
  it('7. Customer cannot access dealership-wide vehicles inventory', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(listRes.status).toBe(403);

    const singleRes = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleStockBranch1Id}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(singleRes.status).toBe(403);

    // Public truck catalogue should still be accessible
    const catalogueRes = await request(app.getHttpServer())
      .get('/api/v1/truck-models');

    expect(catalogueRes.status).toBe(200);
  });

  // TEST 8: Invalid branch ID does not fall back to first branch
  it('8. Invalid branch ID does not fall back to first branch', async () => {
    const nonExistentBranchId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app.getHttpServer())
      .post('/api/v1/inventory/vehicles')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        vin: `VIN-NONEXISTENT-${Date.now()}`,
        chassisNumber: `CHS-NONEXISTENT-${Date.now()}`,
        engineNumber: `ENG-NONEXISTENT-${Date.now()}`,
        branchId: nonExistentBranchId,
        color: 'WHITE',
      });

    // Must return 404 or 400, NEVER 201 created by silently picking another branch
    expect([400, 404]).toContain(res.status);
  });

  // TEST 9: Invalid variant ID does not fall back to first variant
  it('9. Invalid variant ID does not fall back to first variant', async () => {
    const nonExistentVariantId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app.getHttpServer())
      .post('/api/v1/inventory/vehicles')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        vin: `VIN-NONVAR-${Date.now()}`,
        chassisNumber: `CHS-NONVAR-${Date.now()}`,
        engineNumber: `ENG-NONVAR-${Date.now()}`,
        branchId: branch1AId,
        variantId: nonExistentVariantId,
        color: 'WHITE',
      });

    // Must return 404 or 400, NEVER 201 created by silently picking another variant
    expect([400, 404]).toContain(res.status);
  });

  // TEST 10: Wrong password fails
  it('10. Wrong password fails authentication', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: adminEmail,
        password: 'IncorrectPassword999!',
      });

    expect(res.status).toBe(401);
  });

  // TEST 11: Hardcoded development passwords fail unless genuinely stored
  it('11. Hardcoded development passwords fail unless genuinely stored', async () => {
    const bypassPasswords = [
      'Admin123!',
      'demo1234',
      'password123',
      'AdminSecret123!',
      'Manager123!',
      'Sales123!',
      'Mechanic123!',
      'Customer123!',
    ];

    for (const bypass of bypassPasswords) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: bypass,
        });

      expect(res.status).toBe(401);
    }
  });
});
