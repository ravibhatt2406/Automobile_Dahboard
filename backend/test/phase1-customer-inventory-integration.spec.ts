import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Phase 1 — Customer Branch Experience and Inventory Integration Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let customer1Token: string;
  let customer1User: any;
  let customer1Record: any;

  let customer2Token: string;
  let customer2User: any;
  let customer2Record: any;

  let branch1: any;
  let branch2: any;
  let franchiseId: string;
  let vehicle1: any;
  let vehicle2: any;
  let variant1: any;

  const testPassword = 'Password@123';
  let ts: number;

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

    ts = Date.now();
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // 1. Create Franchise & Branches
    const franchise = await prisma.franchise.create({
      data: {
        code: `P1-FRAN-${ts}`,
        name: `Titan Auto Fleet Hub ${ts}`,
        legalName: 'Titan Auto Commercial Fleet Ltd',
        taxId: `08FRANP1${ts.toString().slice(-4)}`,
        status: 'ACTIVE',
      },
    });
    franchiseId = franchise.id;

    branch1 = await prisma.branch.create({
      data: {
        franchiseId: franchise.id,
        code: `P1-BR1-${ts}`,
        name: `Jaipur Fleet Hub ${ts}`,
        city: 'Jaipur',
        state: 'Rajasthan',
        address: '101 Transport Nagar, Jaipur',
        status: 'ACTIVE',
      },
    });

    branch2 = await prisma.branch.create({
      data: {
        franchiseId: franchise.id,
        code: `P1-BR2-${ts}`,
        name: `Jodhpur Logistics Hub ${ts}`,
        city: 'Jodhpur',
        state: 'Rajasthan',
        address: '202 Pal Industrial Area, Jodhpur',
        status: 'ACTIVE',
      },
    });

    // Create an active salesperson employee for Branch 1
    const salesUser = await prisma.user.create({
      data: {
        email: `sales.${ts}@fleettest.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });

    await prisma.employee.create({
      data: {
        userId: salesUser.id,
        branchId: branch1.id,
        employeeCode: `EMP-S1-${ts.toString().slice(-4)}`,
        firstName: 'Vikram',
        lastName: 'Sharma',
        designation: 'Commercial Fleet Sales Advisor',
        status: 'ACTIVE',
      },
    });

    // 2. Create Manufacturer, Model, Variant
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Ashok Leyland ${ts}`,
        country: 'India',
        status: 'ACTIVE',
      },
    });

    const truckModel = await prisma.truckModel.create({
      data: {
        manufacturerId: manufacturer.id,
        name: `AVTR 2820 ${ts}`,
        category: 'Haulage',
        status: 'ACTIVE',
      },
    });

    variant1 = await prisma.truckVariant.create({
      data: {
        modelId: truckModel.id,
        name: `AVTR 2820 6x2 MAV ${ts}`,
        basePrice: 3200000,
        fuelType: 'DIESEL',
        transmission: 'Manual',
        horsepower: 200,
        payload: 20000,
        status: 'ACTIVE',
      },
    });

    // 3. Create Vehicles in branches
    vehicle1 = await prisma.vehicle.create({
      data: {
        variantId: variant1.id,
        branchId: branch1.id,
        vin: `VINP1A${ts}001`,
        engineNumber: `ENGP1A${ts}001`,
        color: 'Titan White',
        manufacturingYear: 2026,
        baseCost: 2800000,
        sellingPrice: 3250000,
        status: 'IN_STOCK',
      },
    });

    vehicle2 = await prisma.vehicle.create({
      data: {
        variantId: variant1.id,
        branchId: branch2.id,
        vin: `VINP1B${ts}002`,
        engineNumber: `ENGP1B${ts}002`,
        color: 'Signal Red',
        manufacturingYear: 2026,
        baseCost: 2800000,
        sellingPrice: 3300000,
        status: 'IN_STOCK',
      },
    });

    // 4. Create Customers
    customer1User = await prisma.user.create({
      data: {
        email: `customer1.${ts}@fleettest.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    customer1Record = await prisma.customer.create({
      data: {
        userId: customer1User.id,
        name: 'Fleet Director 1',
        companyName: `Rajasthan Freight Line ${ts}`,
        email: customer1User.email,
        phone: `98290${ts.toString().slice(-5)}`,
        address: 'Jaipur Depot 1',
        city: 'Jaipur',
        state: 'Rajasthan',
        customerType: 'BUSINESS',
        status: 'ACTIVE',
      },
    });

    customer2User = await prisma.user.create({
      data: {
        email: `customer2.${ts}@fleettest.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    customer2Record = await prisma.customer.create({
      data: {
        userId: customer2User.id,
        name: 'Fleet Director 2',
        companyName: `Gujarat Logistics Line ${ts}`,
        email: customer2User.email,
        phone: `98291${ts.toString().slice(-5)}`,
        address: 'Ahmedabad Depot 2',
        city: 'Ahmedabad',
        state: 'Gujarat',
        customerType: 'BUSINESS',
        status: 'ACTIVE',
      },
    });

    // Authenticate customers to obtain JWTs
    const login1Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: customer1User.email, password: testPassword });
    customer1Token = login1Res.body.data.accessToken;

    const login2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: customer2User.email, password: testPassword });
    customer2Token = login2Res.body.data.accessToken;
  });

  afterAll(async () => {
    if (franchiseId) {
      try {
        await prisma.chatMessage.deleteMany({ where: { conversation: { branch: { franchiseId } } } });
        await prisma.conversation.deleteMany({ where: { branch: { franchiseId } } });
        await prisma.quotationItem.deleteMany({ where: { quotation: { branch: { franchiseId } } } });
        await prisma.quotation.deleteMany({ where: { branch: { franchiseId } } });
        await prisma.vehicle.deleteMany({ where: { branch: { franchiseId } } });
        await prisma.customerFranchise.deleteMany({ where: { franchiseId } });
        await prisma.customer.deleteMany({ where: { email: { contains: `${ts}` } } });
        await prisma.user.deleteMany({ where: { email: { contains: `${ts}` } } });
        await prisma.branch.deleteMany({ where: { franchiseId } });
        await prisma.franchise.deleteMany({ where: { id: franchiseId } });
      } catch (err) {
        // cleanup error ignored
      }
    }
    await app.close();
  });

  describe('1. Real Branch-Wise Browse Trucks Experience', () => {
    it('should browse customer-visible trucks across all branches by default', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/vehicles/browse')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      const data = res.body.data;
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(2);

      const foundV1 = data.items.find((i: any) => i.id === vehicle1.id);
      expect(foundV1).toBeDefined();
      expect(foundV1.branchName).toBe(branch1.name);
      expect(foundV1.branchCity).toBe('Jaipur');
      expect(foundV1.isAvailable).toBe(true);
      expect(foundV1.availability).toBe('AVAILABLE');

      // Security check: VIN, engineNumber, and baseCost must NOT be exposed
      expect(foundV1.vin).toBeUndefined();
      expect(foundV1.engineNumber).toBeUndefined();
      expect(foundV1.baseCost).toBeUndefined();
    });

    it('should filter real trucks by city parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/vehicles/browse?city=Jaipur')
        .expect(200);

      const items = res.body.data.items;
      expect(items.every((i: any) => i.branchCity.toLowerCase() === 'jaipur')).toBe(true);
      expect(items.some((i: any) => i.id === vehicle1.id)).toBe(true);
      expect(items.some((i: any) => i.id === vehicle2.id)).toBe(false);
    });

    it('should filter real trucks by branchId parameter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/browse?branchId=${branch2.id}`)
        .expect(200);

      const items = res.body.data.items;
      expect(items.every((i: any) => i.branchId === branch2.id)).toBe(true);
      expect(items.some((i: any) => i.id === vehicle2.id)).toBe(true);
      expect(items.some((i: any) => i.id === vehicle1.id)).toBe(false);
    });

    it('should fetch public active branches with real database data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/branches/public/active')
        .expect(200);

      const branches = res.body.data;
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.some((b: any) => b.id === branch1.id)).toBe(true);
      expect(branches.some((b: any) => b.id === branch2.id)).toBe(true);
    });

    it('should report equivalent branches holding in-stock inventory for a variant', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/equivalent-branches/${variant1.id}`)
        .expect(200);

      const equivalents = res.body.data;
      expect(Array.isArray(equivalents)).toBe(true);
      expect(equivalents.length).toBeGreaterThanOrEqual(2);

      const b1Entry = equivalents.find((e: any) => e.branch.id === branch1.id);
      expect(b1Entry).toBeDefined();
      expect(b1Entry.availableCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Preferred Branch Selection & Persistence', () => {
    it('should allow customer to set and persist their preferred branch', async () => {
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/customers/${customer1Record.id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ preferredBranchId: branch1.id })
        .expect(200);

      expect(updateRes.body.data.preferredBranchId).toBe(branch1.id);

      // Verify Customer Dashboard includes the preferred branch
      const dashRes = await request(app.getHttpServer())
        .get('/api/v1/dashboards/customer')
        .set('Authorization', `Bearer ${customer1Token}`)
        .expect(200);

      expect(dashRes.body.data.preferredBranchId).toBe(branch1.id);
      expect(dashRes.body.data.preferredBranch?.name).toBe(branch1.name);
    });

    it('should allow customer to clear their preferred branch without errors', async () => {
      const clearRes = await request(app.getHttpServer())
        .patch(`/api/v1/customers/${customer1Record.id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ preferredBranchId: null })
        .expect(200);

      expect(clearRes.body.data.preferredBranchId).toBeNull();
    });

    it('should reject setting an invalid or non-existent branchId', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/customers/${customer1Record.id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ preferredBranchId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });

    it('should prevent one customer from modifying another customer preferred branch', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/customers/${customer2Record.id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ preferredBranchId: branch1.id })
        .expect(403);
    });
  });

  describe('3. Quotation & Booking Branch Logic', () => {
    it('should create quotation linked to vehicle actual branch', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/quotations')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          variantId: variant1.id,
          vehicleId: vehicle1.id,
          branchId: branch1.id,
          quantity: 1,
        });

      if (res.status !== 201) {
        console.error('QUOTATION TEST ERROR BODY:', JSON.stringify(res.body));
      }
      expect(res.status).toBe(201);
      expect(res.body.data.branchId).toBe(branch1.id);
      expect(res.body.data.quotationNumber).toBeDefined();
    });

    it('should reject quotation when vehicle does not belong to specified branch', async () => {
      // vehicle1 is in branch1, but we pass branch2
      await request(app.getHttpServer())
        .post('/api/v1/quotations')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          variantId: variant1.id,
          vehicleId: vehicle1.id,
          branchId: branch2.id,
          quantity: 1,
        })
        .expect(400);
    });
  });

  describe('4. Customer-to-Branch Persistent Chat & Isolation', () => {
    let conversationId: string;

    it('should allow customer to start conversation with a branch', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          branchId: branch1.id,
          subject: 'Inquiry regarding AVTR 2820 stock',
          contextType: 'GENERAL',
          initialMessage: 'Hello, is this truck ready for delivery this week?',
        })
        .expect(201);

      conversationId = res.body.data.id;
      expect(conversationId).toBeDefined();
      expect(res.body.data.branchId).toBe(branch1.id);
      expect(res.body.data.customerId).toBe(customer1Record.id);
    });

    it('should allow customer to send message in their conversation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          message: 'Can you provide the final on-road estimation including registration?',
        })
        .expect(201);

      expect(res.body.data.message).toContain('on-road estimation');
      expect(res.body.data.senderType).toBe('CUSTOMER');
    });

    it('should prevent another customer from viewing or sending messages to this conversation', async () => {
      // customer2 tries to access customer1 conversation
      await request(app.getHttpServer())
        .get(`/api/v1/chat/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .expect(403);

      await request(app.getHttpServer())
        .post(`/api/v1/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ message: 'Unauthorized intrusion attempt' })
        .expect(403);
    });
  });
});
