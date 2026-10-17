import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Phase 2 — Authentication and Login Repair Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ts = Date.now();
  const testPassword = 'SecurePassword123!';
  const customerEmail = `fleet_customer_${ts}@rajasthanlogistics.com`;
  const rawCustomerPhoneDigits = `98290${ts.toString().slice(-5)}`;
  const formattedCustomerPhone = `+91 ${rawCustomerPhoneDigits.slice(0, 5)} ${rawCustomerPhoneDigits.slice(5)}`;

  let activeCustomerId: string;
  let activeCustomerUserId: string;

  let inactiveUserId: string;
  const inactiveUserEmail = `inactive_user_${ts}@titanauto.com`;

  let pendingUserId: string;
  const pendingUserEmail = `pending_user_${ts}@titanauto.com`;

  let offlineCustomerEmail = `offline_buyer_${ts}@transportfleet.com`;
  let offlineCustomerPhone = `+91 99887${ts.toString().slice(-5)}`;
  let offlineCustomerProfileId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const passwordHash = await bcrypt.hash(testPassword, 10);

    // 1. Create an active customer user with linked customer profile
    const activeUser = await prisma.user.create({
      data: {
        email: customerEmail,
        phone: formattedCustomerPhone,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    activeCustomerUserId = activeUser.id;

    const activeCust = await prisma.customer.create({
      data: {
        userId: activeUser.id,
        name: 'Rajasthan Freight Logistics',
        email: customerEmail,
        phone: formattedCustomerPhone,
        customerType: 'BUSINESS',
        status: 'ACTIVE',
      },
    });
    activeCustomerId = activeCust.id;

    // 2. Create an inactive user
    const inactUser = await prisma.user.create({
      data: {
        email: inactiveUserEmail,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'INACTIVE',
      },
    });
    inactiveUserId = inactUser.id;

    // 3. Create a pending approval employee/user
    const pendUser = await prisma.user.create({
      data: {
        email: pendingUserEmail,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'PENDING',
      },
    });
    pendingUserId = pendUser.id;

    // 4. Create an unlinked offline customer profile (e.g. bought a vehicle via dealership walk-in)
    const offlineCust = await prisma.customer.create({
      data: {
        name: 'Offline Transport Fleet Pvt Ltd',
        email: offlineCustomerEmail,
        phone: offlineCustomerPhone,
        customerType: 'BUSINESS',
        status: 'ACTIVE',
        userId: null,
      },
    });
    offlineCustomerProfileId = offlineCust.id;
  });

  afterAll(async () => {
    try {
      // Clean up test data
      await prisma.customer.deleteMany({
        where: {
          id: { in: [activeCustomerId, offlineCustomerProfileId] },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: [activeCustomerUserId, inactiveUserId, pendingUserId] },
        },
      });
    } catch {}
    await app.close();
  });

  describe('1. Standard Customer Login & Normalization', () => {
    it('should successfully log in with exact customer email and correct password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerEmail,
          password: testPassword,
        })
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user.email).toBe(customerEmail);
      expect(body.user.accountType).toBe('CUSTOMER');
      expect(body.user.roles).toContain('CUSTOMER');
      expect(body.user.customerId).toBe(activeCustomerId);
    });

    it('should successfully log in with UPPERCASE email (case normalization)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerEmail.toUpperCase(),
          password: testPassword,
        })
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.accessToken).toBeDefined();
      expect(body.user.email).toBe(customerEmail);
    });

    it('should successfully log in with email having leading and trailing whitespace', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `   ${customerEmail}   `,
          password: testPassword,
        })
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.accessToken).toBeDefined();
    });

    it('should successfully log in with raw 10 digits phone number', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: rawCustomerPhoneDigits,
          password: testPassword,
        })
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.accessToken).toBeDefined();
      expect(body.user.customerId).toBe(activeCustomerId);
    });

    it('should successfully log in with E.164 phone format (+9198290...)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `+91${rawCustomerPhoneDigits}`,
          password: testPassword,
        })
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.accessToken).toBeDefined();
    });

    it('should successfully log in using emailOrPhone field payload alias', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          emailOrPhone: customerEmail,
          password: testPassword,
        })
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.accessToken).toBeDefined();
    });
  });

  describe('2. Authentication Error Handling & Account Status', () => {
    it('should return 401 Invalid email or password on wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerEmail,
          password: 'CompletelyWrongPassword!',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 401 Invalid email or password for non-existent user without revealing account presence', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'non_existent_random_user_9999@test.com',
          password: testPassword,
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login for INACTIVE account status', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: inactiveUserEmail,
          password: testPassword,
        })
        .expect(401);

      expect(res.body.message).toContain('INACTIVE');
    });

    it('should reject login for PENDING approval account status with 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: pendingUserEmail,
          password: testPassword,
        })
        .expect(403);

      expect(res.body.message).toContain('pending manager approval');
    });
  });

  describe('3. Customer Registration & Existing Profile Linkage', () => {
    const newRegEmail = `new_portal_customer_${ts}@testmail.com`;
    const newRegPhone = `+91 97711${ts.toString().slice(-5)}`;

    it('should allow public registration only for CUSTOMER role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Shyam Sundar',
          email: newRegEmail,
          phone: newRegPhone,
          password: testPassword,
          termsAccepted: true,
        })
        .expect(201);

      const body = res.body.data || res.body;
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user.accountType).toBe('CUSTOMER');
      expect(body.user.roles).toEqual(['CUSTOMER']);
    });

    it('should reject duplicate customer registration for already registered email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate Registrant',
          email: newRegEmail.toUpperCase(),
          phone: `+91 91111${ts.toString().slice(-5)}`,
          password: testPassword,
          termsAccepted: true,
        })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('should securely link an existing unlinked customer profile (offline purchase) upon registration without creating duplicates', async () => {
      // Prior to registration, verify offline customer has userId === null
      const preCheck = await prisma.customer.findUnique({
        where: { id: offlineCustomerProfileId },
      });
      expect(preCheck?.userId).toBeNull();

      // Register with matching offline customer email
      const regRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Offline Transport Fleet Pvt Ltd',
          email: offlineCustomerEmail,
          phone: offlineCustomerPhone,
          password: testPassword,
          termsAccepted: true,
        })
        .expect(201);

      const regBody = regRes.body.data || regRes.body;
      expect(regBody.accessToken).toBeDefined();
      expect(regBody.user.customerId).toBe(offlineCustomerProfileId);

      // Verify in DB that the customer was linked and no duplicate was created
      const postCheck = await prisma.customer.findMany({
        where: { email: offlineCustomerEmail },
      });
      expect(postCheck.length).toBe(1);
      expect(postCheck[0].id).toBe(offlineCustomerProfileId);
      expect(postCheck[0].userId).toBe(regBody.user.id);

      // Verify that the customer can immediately log in with their new credentials
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: offlineCustomerEmail,
          password: testPassword,
        })
        .expect(200);

      const loginBody = loginRes.body.data || loginRes.body;
      expect(loginBody.user.customerId).toBe(offlineCustomerProfileId);
    });
  });

  describe('4. Roles, Scopes, and Multi-Tenant Authorization', () => {
    let customerAccessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerEmail,
          password: testPassword,
        });
      const body = res.body.data || res.body;
      customerAccessToken = body.accessToken;
    });

    it('should return trusted identity profile via /api/v1/auth/me', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.user.id).toBe(activeCustomerUserId);
      expect(body.user.accountType).toBe('CUSTOMER');
      expect(body.user.roles).toContain('CUSTOMER');
      expect(body.user.employeeId).toBeNull();
      expect(body.user.customerId).toBe(activeCustomerId);
    });

    it('should deny customer access to internal employee-only dashboards (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboards/super-admin')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/dashboards/branch-manager')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/dashboards/mechanic')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(403);
    });

    it('should reject requests with invalid or expired bearer tokens with 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.value')
        .expect(401);
    });

    it('should successfully refresh session with valid refresh token', async () => {
      // First get a fresh refresh token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerEmail,
          password: testPassword,
        });
      const body = loginRes.body.data || loginRes.body;
      const refreshToken = body.refreshToken;

      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      const refBody = refreshRes.body.data || refreshRes.body;
      expect(refBody.accessToken).toBeDefined();
      expect(refBody.refreshToken).toBeDefined();
    });

    it('should reject refresh attempt with an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'completely.invalid.refresh.token' })
        .expect(401);
    });
  });

  describe('5. Google Authentication Guard & Config Verification', () => {
    it('should reject missing credential in Google sign-in payload with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/google')
        .send({})
        .expect(400);
    });

    it('should reject invalid or unverified Google tokens with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/google')
        .send({ credential: 'fake.google.id.token' })
        .expect(401);

      expect(res.body.message).toContain('Google token');
    });
  });
});
