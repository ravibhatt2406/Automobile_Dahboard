import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('Phase 3 — CSV Data Import and Export Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  let superAdminToken: string;
  let branchManagerToken: string;
  let otherBranchManagerToken: string;
  let customerToken: string;

  let testFranchise: any;
  let testBranchA: any;
  let testBranchB: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    // Clean up any old test entities with prefix CSVTEST_
    await prisma.customerFranchise.deleteMany({
      where: { customer: { phone: { startsWith: '9900' } } },
    });
    await prisma.customer.deleteMany({
      where: { phone: { startsWith: '9900' } },
    });
    await prisma.employeeApprovalRequest.deleteMany({
      where: { employee: { employeeCode: { startsWith: 'CSV-EMP' } } },
    });
    await prisma.employeeRoleAssignment.deleteMany({
      where: { employee: { employeeCode: { startsWith: 'CSV-EMP' } } },
    });
    await prisma.employee.deleteMany({
      where: { employeeCode: { startsWith: 'CSV-EMP' } },
    });
    await prisma.branch.deleteMany({
      where: { code: { startsWith: 'CSV-BRN' } },
    });
    await prisma.franchise.deleteMany({
      where: { code: { startsWith: 'CSV-FRAN' } },
    });

    // 1. Setup Test Franchise & Branches
    testFranchise = await prisma.franchise.create({
      data: {
        code: `CSV-FRAN-${Date.now()}`,
        name: 'CSV Test Franchise Hub',
        legalName: 'CSV Test Franchise Pvt Ltd',
        taxId: '08CSVFRAN1111',
        status: 'ACTIVE',
      },
    });

    testBranchA = await prisma.branch.create({
      data: {
        franchiseId: testFranchise.id,
        code: `CSV-BRN-A-${Date.now()}`,
        name: 'CSV Branch Alpha',
        city: 'Jaipur',
        state: 'Rajasthan',
        status: 'ACTIVE',
      },
    });

    testBranchB = await prisma.branch.create({
      data: {
        franchiseId: testFranchise.id,
        code: `CSV-BRN-B-${Date.now()}`,
        name: 'CSV Branch Beta',
        city: 'Jodhpur',
        state: 'Rajasthan',
        status: 'ACTIVE',
      },
    });

    const testPassword = 'Password@123';
    const hash = await bcrypt.hash(testPassword, 10);

    // 2. Setup Super Admin
    const superAdminUser = await prisma.user.create({
      data: {
        email: `csv.super.${Date.now()}@titanauto.com`,
        passwordHash: hash,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    // 3. Setup Branch Manager A
    const bmUserA = await prisma.user.create({
      data: {
        email: `csv.bma.${Date.now()}@titanauto.com`,
        passwordHash: hash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    const bmEmpA = await prisma.employee.create({
      data: {
        userId: bmUserA.id,
        branchId: testBranchA.id,
        employeeCode: `CSV-EMP-BMA-${Date.now()}`,
        firstName: 'Manager',
        lastName: 'Alpha',
        status: 'ACTIVE',
      },
    });
    const bmRole = await prisma.role.findFirst({ where: { name: 'BRANCH_MANAGER' } });
    if (bmRole) {
      await prisma.employeeRoleAssignment.create({
        data: { employeeId: bmEmpA.id, roleId: bmRole.id },
      });
    }

    // 4. Setup Branch Manager B
    const bmUserB = await prisma.user.create({
      data: {
        email: `csv.bmb.${Date.now()}@titanauto.com`,
        passwordHash: hash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    const bmEmpB = await prisma.employee.create({
      data: {
        userId: bmUserB.id,
        branchId: testBranchB.id,
        employeeCode: `CSV-EMP-BMB-${Date.now()}`,
        firstName: 'Manager',
        lastName: 'Beta',
        status: 'ACTIVE',
      },
    });
    if (bmRole) {
      await prisma.employeeRoleAssignment.create({
        data: { employeeId: bmEmpB.id, roleId: bmRole.id },
      });
    }

    // 5. Setup Customer
    const custEmail = `csv.customer.${Date.now()}@logistics.in`;
    const custUser = await prisma.user.create({
      data: {
        email: custEmail,
        passwordHash: hash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            name: 'CSV Test Customer',
            email: custEmail,
            phone: `990099${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'ACTIVE',
            customerType: 'INDIVIDUAL',
          },
        },
      },
    });

    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: testPassword });
      return res.body.data?.accessToken || res.body.accessToken;
    };

    superAdminToken = await login(superAdminUser.email);
    branchManagerToken = await login(bmUserA.email);
    otherBranchManagerToken = await login(bmUserB.email);
    customerToken = await login(custUser.email);
  });

  afterAll(async () => {
    await prisma.customerFranchise.deleteMany({
      where: { customer: { phone: { startsWith: '9900' } } },
    });
    await prisma.customer.deleteMany({
      where: { phone: { startsWith: '9900' } },
    });
    await prisma.employeeApprovalRequest.deleteMany({
      where: { employee: { employeeCode: { startsWith: 'CSV-EMP' } } },
    });
    await prisma.employeeRoleAssignment.deleteMany({
      where: { employee: { employeeCode: { startsWith: 'CSV-EMP' } } },
    });
    await prisma.employee.deleteMany({
      where: { employeeCode: { startsWith: 'CSV-EMP' } },
    });
    await prisma.branch.deleteMany({
      where: { code: { startsWith: 'CSV-BRN' } },
    });
    await prisma.franchise.deleteMany({
      where: { code: { startsWith: 'CSV-FRAN' } },
    });
    await app.close();
  });

  // ==========================================
  // TEST 1: CSV TEMPLATES
  // ==========================================
  it('1. Downloadable CSV templates return expected headers and mime-type for all supported entities', async () => {
    for (const entity of ['customers', 'branches', 'franchises', 'employees']) {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/csv-data/templates/${entity}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain(`${entity}-template.csv`);
      expect(res.text.length).toBeGreaterThan(10);
    }
  });

  // ==========================================
  // TEST 2: VALID CUSTOMER IMPORT
  // ==========================================
  it('2. Previews and imports valid customers; creates Customer records without insecure user logins', async () => {
    const ts = Date.now();
    const csvContent = [
      'name,phone,email,customerType,companyName,address,city,state,pincode,gstin,franchiseCode',
      `Vikram Trans,990011${ts.toString().slice(-4)},vikram.${ts}@trans.in,BUSINESS,Vikram Transport Pvt,Ring Road,Jaipur,RJ,302001,,${testFranchise.code}`,
      `Anita Sharma,990022${ts.toString().slice(-4)},anita.${ts}@gmail.com,INDIVIDUAL,,,Mansarovar,Jaipur,RJ,302020,,`,
    ].join('\r\n');

    // Preview
    const previewRes = await request(app.getHttpServer())
      .post('/api/v1/csv-data/preview/customers')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({ csvContent })
      .expect(201);

    const previewData = previewRes.body.data || previewRes.body;
    expect(previewData.totalRows).toBe(2);
    expect(previewData.validRowsCount).toBe(2);
    expect(previewData.invalidRowsCount).toBe(0);
    expect(previewData.canCommit).toBe(true);

    // Commit Import
    const importRes = await request(app.getHttpServer())
      .post('/api/v1/csv-data/import/customers')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({ csvContent })
      .expect(201);

    const importData = importRes.body.data || importRes.body;
    expect(importData.success).toBe(true);
    expect(importData.importedCount).toBe(2);

    // Verify DB records
    const custA = await prisma.customer.findFirst({
      where: { email: `vikram.${ts}@trans.in` },
      include: { franchiseLinks: true },
    });
    expect(custA).toBeDefined();
    expect(custA?.customerType).toBe('BUSINESS');
    expect(custA?.userId).toBeNull(); // No insecure login created
    expect(custA?.franchiseLinks.length).toBe(1);
    expect(custA?.franchiseLinks[0].franchiseId).toBe(testFranchise.id);
  });

  // ==========================================
  // TEST 3: MALFORMED CSV HANDLING
  // ==========================================
  it('3. Rejects malformed CSV headers with 400 Bad Request identifying missing columns', async () => {
    const malformedCsv = [
      'wrong_header_one,wrong_header_two',
      'value1,value2',
    ].join('\r\n');

    const res = await request(app.getHttpServer())
      .post('/api/v1/csv-data/preview/customers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ csvContent: malformedCsv })
      .expect(400);

    expect(res.body.message).toContain('Missing required column headers');
  });

  // ==========================================
  // TEST 4: DUPLICATE DETECTION AND HANDLING
  // ==========================================
  it('4. Detects existing DB records and intra-file duplicates; safely skips without corrupting DB', async () => {
    const ts = Date.now();
    const existingPhone = `990033${ts.toString().slice(-4)}`;
    await prisma.customer.create({
      data: {
        name: 'Pre-existing Fleet Client',
        phone: existingPhone,
        customerType: 'INDIVIDUAL',
        status: 'ACTIVE',
      },
    });

    const csvWithDuplicates = [
      'name,phone,email,customerType,companyName,address,city,state,pincode,gstin,franchiseCode',
      `Duplicate Client,${existingPhone},dupe1@test.com,INDIVIDUAL,,,,,,,`, // DB dupe
      `Fresh Client,990044${ts.toString().slice(-4)},fresh1@test.com,INDIVIDUAL,,,,,,,`, // Valid
      `Repeat Fresh Client,990044${ts.toString().slice(-4)},fresh2@test.com,INDIVIDUAL,,,,,,,`, // File dupe
    ].join('\r\n');

    const previewRes = await request(app.getHttpServer())
      .post('/api/v1/csv-data/preview/customers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ csvContent: csvWithDuplicates })
      .expect(201);

    const previewData = previewRes.body.data || previewRes.body;
    expect(previewData.totalRows).toBe(3);
    expect(previewData.validRowsCount).toBe(1);
    expect(previewData.duplicateRowsCount).toBe(2);

    // Import with skipDuplicates: true
    const importRes = await request(app.getHttpServer())
      .post('/api/v1/csv-data/import/customers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ csvContent: csvWithDuplicates, skipDuplicates: true })
      .expect(201);

    const importData = importRes.body.data || importRes.body;
    expect(importData.importedCount).toBe(1);
    expect(importData.skippedCount).toBe(2);
    expect(importData.errorReportCsv).toBeDefined();
    expect(importData.errorReportCsv).toContain('Duplicate: Customer with phone');
  });

  // ==========================================
  // TEST 5: INVALID FOREIGN KEYS
  // ==========================================
  it('5. Flags non-existent foreign keys (invalid franchiseCode in branch import)', async () => {
    const csvWithInvalidFk = [
      'franchiseCode,code,name,address,city,state,status',
      `NON_EXISTENT_FRAN_CODE,CSV-BRN-X-${Date.now()},Invalid Hub Branch,Address,City,State,ACTIVE`,
    ].join('\r\n');

    const previewRes = await request(app.getHttpServer())
      .post('/api/v1/csv-data/preview/branches')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ csvContent: csvWithInvalidFk })
      .expect(201);

    const previewData = previewRes.body.data || previewRes.body;
    expect(previewData.invalidRowsCount).toBe(1);
    expect(previewData.previewRows[0].errors[0]).toContain('Foreign key error: Franchise code');
  });

  // ==========================================
  // TEST 6: UNAUTHORIZED IMPORT ROLES
  // ==========================================
  it('6. Rejects unauthorized roles from importing franchises or branches (403 Forbidden)', async () => {
    const csvContent = [
      'code,name,legalName,taxId,status',
      `CSV-FRAN-ILLEGAL-${Date.now()},Illegal Franchise,Illegal LLC,TAX123,ACTIVE`,
    ].join('\r\n');

    // Branch manager trying to import franchise
    await request(app.getHttpServer())
      .post('/api/v1/csv-data/import/franchises')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({ csvContent })
      .expect(403);

    // Customer trying to import customers
    await request(app.getHttpServer())
      .post('/api/v1/csv-data/import/customers')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ csvContent: 'name,phone\nTest,9876543210' })
      .expect(403);
  });

  // ==========================================
  // TEST 7: EMPLOYEE IMPORT & APPROVAL WORKFLOW
  // ==========================================
  it('7. Enforces employee approval workflow: User PENDING, Employee PENDING_APPROVAL, and ApprovalRequest created', async () => {
    const ts = Date.now();
    const empCode = `CSV-EMP-WF-${ts.toString().slice(-4)}`;
    const empEmail = `worker.${ts}@ashokleyland.com`;

    const csvContent = [
      'employeeCode,branchCode,firstName,lastName,email,phone,designation,roleName,initialPassword',
      `${empCode},${testBranchA.code},Sanjay,Kumar,${empEmail},990055${ts.toString().slice(-4)},Sales Rep,SALES_EMPLOYEE,Titan@2026!`,
    ].join('\r\n');

    const importRes = await request(app.getHttpServer())
      .post('/api/v1/csv-data/import/employees')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({ csvContent })
      .expect(201);

    const importData = importRes.body.data || importRes.body;
    expect(importData.success).toBe(true);
    expect(importData.importedCount).toBe(1);

    // Verify User is PENDING
    const user = await prisma.user.findUnique({ where: { email: empEmail } });
    expect(user).toBeDefined();
    expect(user?.status).toBe('PENDING');

    // Verify Employee is PENDING_APPROVAL
    const emp = await prisma.employee.findUnique({
      where: { employeeCode: empCode },
      include: { approvalRequests: true },
    });
    expect(emp).toBeDefined();
    expect(emp?.status).toBe('PENDING_APPROVAL');

    // Verify Approval Request is created in PENDING status
    expect(emp?.approvalRequests.length).toBe(1);
    expect(emp?.approvalRequests[0].status).toBe('PENDING');
  });

  // ==========================================
  // TEST 8: SECURITY — REJECT SUPER_ADMIN PRIVILEGE ESCALATION
  // ==========================================
  it('8. Rejects attempts in employee CSV to grant SUPER_ADMIN or escalate privileges beyond creator rank', async () => {
    const ts = Date.now();
    const maliciousCsv = [
      'employeeCode,branchCode,firstName,lastName,email,phone,designation,roleName,initialPassword',
      `CSV-EMP-HACK-${ts},${testBranchA.code},Evil,Hacker,hacker.${ts}@titan.com,990066${ts.toString().slice(-4)},Root,SUPER_ADMIN,Titan@2026!`,
    ].join('\r\n');

    const previewRes = await request(app.getHttpServer())
      .post('/api/v1/csv-data/preview/employees')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({ csvContent: maliciousCsv })
      .expect(201);

    const previewData = previewRes.body.data || previewRes.body;
    expect(previewData.validRowsCount).toBe(0);
    expect(previewData.invalidRowsCount).toBe(1);
    expect(previewData.previewRows[0].errors.join(' ')).toContain(
      'Granting SUPER_ADMIN via CSV import is strictly prohibited',
    );
  });

  // ==========================================
  // TEST 9: CROSS-BRANCH SCOPE ENFORCEMENT
  // ==========================================
  it('9. Denies branch manager from importing employees into another branch', async () => {
    const ts = Date.now();
    const crossBranchCsv = [
      'employeeCode,branchCode,firstName,lastName,email,phone,designation,roleName,initialPassword',
      // Branch Manager A attempting to create employee in Branch B
      `CSV-EMP-XB-${ts},${testBranchB.code},Intruder,User,intruder.${ts}@test.com,990077${ts.toString().slice(-4)},Advisor,SERVICE_ADVISOR,Titan@2026!`,
    ].join('\r\n');

    const previewRes = await request(app.getHttpServer())
      .post('/api/v1/csv-data/preview/employees')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .send({ csvContent: crossBranchCsv })
      .expect(201);

    const previewData = previewRes.body.data || previewRes.body;
    expect(previewData.invalidRowsCount).toBe(1);
    expect(previewData.previewRows[0].errors.join(' ')).toContain('Scope restriction');
  });

  // ==========================================
  // TEST 10: SCOPED EXPORT & FORMULA INJECTION SANITIZATION
  // ==========================================
  it('10. Exports real DB records scoped by tenant without passwords/secrets, and sanitizes spreadsheet formula injection', async () => {
    // Insert a record with formula injection payload
    await prisma.customer.create({
      data: {
        name: '=SUM(1+1)*cmd|"/C calc"!A0', // Dangerous Excel formula
        phone: '9900881234',
        email: '+12345@test.com', // Starts with +
        customerType: 'INDIVIDUAL',
        status: 'ACTIVE',
      },
    });

    const exportRes = await request(app.getHttpServer())
      .get('/api/v1/csv-data/export/customers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(exportRes.headers['content-type']).toContain('text/csv');
    // Verify passwords, hashes or secrets are NEVER present
    expect(exportRes.text).not.toContain('passwordHash');
    expect(exportRes.text).not.toContain('$2b$10$');

    // Verify formula characters are safely escaped with single quote
    expect(exportRes.text).toContain(`"'=SUM(1+1)*cmd|""/C calc""!A0"`);
    expect(exportRes.text).toContain(`'+12345@test.com`);

    // Verify scoped export for Branch Manager: cannot see other franchises/branches
    const branchExportRes = await request(app.getHttpServer())
      .get('/api/v1/csv-data/export/branches')
      .set('Authorization', `Bearer ${branchManagerToken}`)
      .expect(200);

    expect(branchExportRes.text).toContain(testBranchA.code);
    expect(branchExportRes.text).not.toContain('Delhi Fleet Logistics');
  });
});
