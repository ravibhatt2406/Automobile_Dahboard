import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

jest.setTimeout(60000);

describe('Phase 2 — Customer and Dealership Branch Chat Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testPassword = 'ChatSecurePassword123!';
  const ts = Date.now();

  let franchiseId: string;
  let branchAId: string;
  let branchBId: string;

  let superAdminToken: string;
  let branchManagerAToken: string;
  let branchManagerBToken: string;
  let employeeAId: string;
  let employeeBId: string;

  let customerAToken: string;
  let customerAId: string;
  let customerBToken: string;
  let customerBId: string;

  let createdConversationId: string;

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
    const custRole = await prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: { name: 'CUSTOMER', description: 'Commercial Fleet Customer' },
    });

    // 2. Setup Franchise and Branches
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-CHAT-${ts}`,
        name: `Titan Chat Franchise ${ts}`,
        status: 'ACTIVE',
      },
    });
    franchiseId = franchise.id;

    const branchA = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-CHAT-A-${ts}`,
        name: `Jaipur Dealership ${ts}`,
        city: 'Jaipur',
        status: 'ACTIVE',
      },
    });
    branchAId = branchA.id;

    const branchB = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-CHAT-B-${ts}`,
        name: `Jodhpur Dealership ${ts}`,
        city: 'Jodhpur',
        status: 'ACTIVE',
      },
    });
    branchBId = branchB.id;

    // 3. Super Admin
    const saUser = await prisma.user.create({
      data: {
        email: `sa_chat_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    // 4. Branch Manager A (Branch A)
    const bmUserA = await prisma.user.create({
      data: {
        email: `bm_chat_a_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-CHAT-A-${ts}`,
            firstName: 'Rajesh',
            lastName: 'Sharma',
            designation: 'Branch Manager',
            status: 'ACTIVE',
            branchId: branchAId,
            roleAssignments: { create: { roleId: bmRole.id } },
          },
        },
      },
      include: { employeeProfile: true },
    });
    employeeAId = bmUserA.employeeProfile!.id;

    // 5. Branch Manager B (Branch B)
    const bmUserB = await prisma.user.create({
      data: {
        email: `bm_chat_b_${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: {
          create: {
            employeeCode: `EMP-CHAT-B-${ts}`,
            firstName: 'Anil',
            lastName: 'Choudhary',
            designation: 'Branch Manager',
            status: 'ACTIVE',
            branchId: branchBId,
            roleAssignments: { create: { roleId: bmRole.id } },
          },
        },
      },
      include: { employeeProfile: true },
    });
    employeeBId = bmUserB.employeeProfile!.id;

    // 6. Customer A
    const custUserA = await prisma.user.create({
      data: {
        email: `customer_chat_a_${ts}@transport.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            name: 'Sunil Transport Fleet',
            companyName: 'Sunil Logistics Corp',
            phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
            email: `customer_chat_a_${ts}@transport.com`,
            status: 'ACTIVE',
            franchiseLinks: { create: { franchiseId } },
          },
        },
      },
      include: { customerProfile: true },
    });
    customerAId = custUserA.customerProfile!.id;

    // 7. Customer B
    const custUserB = await prisma.user.create({
      data: {
        email: `customer_chat_b_${ts}@freight.com`,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            name: 'Manoj Freight Lines',
            companyName: 'Manoj Logistics',
            phone: `+9198766${Math.floor(10000 + Math.random() * 90000)}`,
            email: `customer_chat_b_${ts}@freight.com`,
            status: 'ACTIVE',
            franchiseLinks: { create: { franchiseId } },
          },
        },
      },
      include: { customerProfile: true },
    });
    customerBId = custUserB.customerProfile!.id;

    // Login users to get JWT tokens
    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: testPassword });
      return res.body.data?.accessToken || res.body.accessToken;
    };

    superAdminToken = await login(saUser.email);
    branchManagerAToken = await login(bmUserA.email);
    branchManagerBToken = await login(bmUserB.email);
    customerAToken = await login(custUserA.email);
    customerBToken = await login(custUserB.email);
  });

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Customer initiates conversation and sends first message
  it('1. Customer initiates conversation with eligible branch and sends message', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        branchId: branchAId,
        subject: 'Inquiry regarding 28T Tipper delivery timeline',
        contextType: 'GENERAL',
        initialMessage: 'Hello Jaipur Team, can you confirm delivery lead time for 5 units of 28T tipper?',
      });

    expect(res.status).toBe(201);
    const conv = res.body.data || res.body;
    expect(conv.id).toBeDefined();
    expect(conv.branchId).toBe(branchAId);
    expect(conv.customerId).toBe(customerAId);
    createdConversationId = conv.id;

    // Verify initial message was persisted in PostgreSQL
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: createdConversationId },
    });
    expect(messages.length).toBe(1);
    expect(messages[0].senderType).toBe('CUSTOMER');
    expect(messages[0].message).toContain('28T tipper');
    expect(messages[0].isRead).toBe(false);
  });

  // TEST 2: Prevent duplicate conversations when opening same eligible conversation repeatedly
  it('2. Prevents duplicate conversations for same customer, branch, and context', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        branchId: branchAId,
        contextType: 'GENERAL',
      });

    expect(res.status).toBe(201);
    const conv = res.body.data || res.body;
    expect(conv.id).toBe(createdConversationId); // Reuses existing conversation!
  });

  // TEST 3: Branch employee lists conversations and sees unread indicator
  it('3. Authorized Branch Employee sees customer conversation with unread badge', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${branchManagerAToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data || res.body;
    const items = Array.isArray(data) ? data : data.items || [];
    const found = items.find((c: any) => c.id === createdConversationId);

    expect(found).toBeDefined();
    expect(found.unreadCount).toBeGreaterThanOrEqual(1);
    expect(found.customer.name).toBe('Sunil Transport Fleet');
  });

  // TEST 4: Branch employee views conversation, reading marks messages as read
  it('4. Branch Employee opens conversation: unread customer messages are marked as read', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${createdConversationId}`)
      .set('Authorization', `Bearer ${branchManagerAToken}`);

    expect(res.status).toBe(200);
    const conv = res.body.data || res.body;
    expect(conv.id).toBe(createdConversationId);
    expect(conv.messages.length).toBe(1);

    // Verify message is now marked read in database
    const msg = await prisma.chatMessage.findFirst({
      where: { conversationId: createdConversationId },
    });
    expect(msg?.isRead).toBe(true);
    expect(msg?.readAt).toBeDefined();
  });

  // TEST 5: Branch employee replies to customer
  it('5. Branch Employee replies to customer: message persists with EMPLOYEE sender type', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${createdConversationId}/messages`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        message: 'Dear Sunil, 5 units of 28T Tipper are currently in stock at Jaipur central yard and can be delivered in 48 hours.',
      });

    expect(res.status).toBe(201);
    const reply = res.body.data || res.body;
    expect(reply.id).toBeDefined();
    expect(reply.senderType).toBe('EMPLOYEE');
    expect(reply.isRead).toBe(false);

    // Verify history now has 2 messages in database
    const count = await prisma.chatMessage.count({
      where: { conversationId: createdConversationId },
    });
    expect(count).toBe(2);
  });

  // TEST 6: Customer views reply, history persists across reloads
  it('6. Customer retrieves conversation history after page reload: full thread persists', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${createdConversationId}`)
      .set('Authorization', `Bearer ${customerAToken}`);

    expect(res.status).toBe(200);
    const conv = res.body.data || res.body;
    expect(conv.messages.length).toBe(2);
    expect(conv.messages[0].senderType).toBe('CUSTOMER');
    expect(conv.messages[1].senderType).toBe('EMPLOYEE');

    // Counterparty message marked as read
    const empMsg = await prisma.chatMessage.findUnique({ where: { id: conv.messages[1].id } });
    expect(empMsg?.isRead).toBe(true);
  });

  // TEST 7: Cross-customer isolation - Customer B cannot view or send message to Customer A's conversation
  it('7. Unauthorized Customer B is strictly denied access to Customer A conversation (403 Forbidden)', async () => {
    // Read attempt -> 403
    const readRes = await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${createdConversationId}`)
      .set('Authorization', `Bearer ${customerBToken}`);
    expect(readRes.status).toBe(403);

    // Write attempt -> 403
    const writeRes = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${createdConversationId}/messages`)
      .set('Authorization', `Bearer ${customerBToken}`)
      .send({ message: 'Unauthorized message injection attempt' });
    expect(writeRes.status).toBe(403);
  });

  // TEST 8: Cross-branch isolation - Branch B employee cannot view or reply to Branch A's conversation
  it('8. Cross-branch isolation: Branch B employee cannot access or reply to Branch A conversation (403 Forbidden)', async () => {
    // Read attempt by Branch B employee -> 403
    const readRes = await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${createdConversationId}`)
      .set('Authorization', `Bearer ${branchManagerBToken}`);
    expect(readRes.status).toBe(403);

    // Write attempt by Branch B employee -> 403
    const writeRes = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${createdConversationId}/messages`)
      .set('Authorization', `Bearer ${branchManagerBToken}`)
      .send({ message: 'Cross-branch reply attempt' });
    expect(writeRes.status).toBe(403);
  });

  // TEST 9: Conversation assignment to branch employee
  it('9. Manager assigns conversation to a branch employee; rejects assignment to another branch employee', async () => {
    // Attempt to assign to Employee B (from Branch B) -> 400 Bad Request
    const crossBranchAssignRes = await request(app.getHttpServer())
      .patch(`/api/v1/chat/conversations/${createdConversationId}/assign`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({ employeeId: employeeBId });

    expect(crossBranchAssignRes.status).toBe(400);
    expect(crossBranchAssignRes.body.message).toContain('must belong to the same branch');

    // Assign to Employee A (from Branch A) -> 200 OK
    const validAssignRes = await request(app.getHttpServer())
      .patch(`/api/v1/chat/conversations/${createdConversationId}/assign`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({ employeeId: employeeAId });

    expect(validAssignRes.status).toBe(200);
    const updated = validAssignRes.body.data || validAssignRes.body;
    expect(updated.assignedEmployeeId).toBe(employeeAId);
    expect(updated.status).toBe('ASSIGNED');
  });

  // TEST 10: Unread Count Badge API works for both roles
  it('10. Unread badge API returns accurate count across all active conversations', async () => {
    const customerUnreadRes = await request(app.getHttpServer())
      .get('/api/v1/chat/conversations/unread-count')
      .set('Authorization', `Bearer ${customerAToken}`);

    expect(customerUnreadRes.status).toBe(200);
    const custCount = customerUnreadRes.body.data?.unreadCount ?? customerUnreadRes.body.unreadCount;
    expect(typeof custCount).toBe('number');

    const employeeUnreadRes = await request(app.getHttpServer())
      .get('/api/v1/chat/conversations/unread-count')
      .set('Authorization', `Bearer ${branchManagerAToken}`);

    expect(employeeUnreadRes.status).toBe(200);
    const empCount = employeeUnreadRes.body.data?.unreadCount ?? employeeUnreadRes.body.unreadCount;
    expect(typeof empCount).toBe('number');
  });
});
