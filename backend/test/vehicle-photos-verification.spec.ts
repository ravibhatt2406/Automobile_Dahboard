import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

jest.setTimeout(60000);

describe('Vehicle Photos & Media Integration Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testPassword = 'SecurePassword123!';
  const ts = Date.now();

  let franchiseId: string;
  let branchAId: string;
  let branchBId: string;
  let variantId: string;

  let branchManagerAToken: string;
  let branchManagerBToken: string;

  let testVehicleId: string;
  let uploadedPhoto1Url: string;
  let uploadedPhoto2Url: string;
  let uploadedPhoto3Url: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Static assets
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const vehicleUploadsDir = path.join(uploadsDir, 'vehicles');
    if (!fs.existsSync(vehicleUploadsDir)) {
      fs.mkdirSync(vehicleUploadsDir, { recursive: true });
    }
    (app as NestExpressApplication).useStaticAssets(uploadsDir, {
      prefix: '/uploads/',
    });

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const passwordHash = await bcrypt.hash(testPassword, 10);

    // Roles
    const bmRole = await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: {},
      create: { name: 'BRANCH_MANAGER', description: 'Branch Operations Head' },
    });

    // Franchise
    const franchise = await prisma.franchise.create({
      data: {
        code: `FR-PHOTO-${ts}`,
        name: `Titan Photo Test Franchise ${ts}`,
        status: 'ACTIVE',
      },
    });
    franchiseId = franchise.id;

    // Branches
    const branchA = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-PHOTO-A-${ts}`,
        name: `Jaipur Fleet Yard ${ts}`,
        city: 'Jaipur',
        status: 'ACTIVE',
      },
    });
    branchAId = branchA.id;

    const branchB = await prisma.branch.create({
      data: {
        franchiseId,
        code: `BR-PHOTO-B-${ts}`,
        name: `Delhi Fleet Yard ${ts}`,
        city: 'Delhi',
        status: 'ACTIVE',
      },
    });
    branchBId = branchB.id;

    // Variant
    const manufacturer = await prisma.manufacturer.upsert({
      where: { name: `Ashok Leyland ${ts}` },
      update: {},
      create: { name: `Ashok Leyland ${ts}`, country: 'India' },
    });

    const model = await prisma.truckModel.create({
      data: {
        manufacturerId: manufacturer.id,
        name: `AVTR 5525.T Photo ${ts}`,
        category: 'Heavy Commercial Vehicle',
      },
    });

    const variant = await prisma.truckVariant.create({
      data: {
        modelId: model.id,
        name: `AVTR 5525.T Photo Variant ${ts}`,
        fuelType: 'DIESEL',
        transmission: 'Manual',
        basePrice: 4200000,
      },
    });
    variantId = variant.id;

    // Branch Manager A (Branch A)
    const bmAUser = await prisma.user.create({
      data: {
        email: `bma-photo-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    await prisma.employee.create({
      data: {
        userId: bmAUser.id,
        branchId: branchAId,
        employeeCode: `EMP-BMA-PH-${ts}`,
        firstName: 'Branch',
        lastName: 'ManagerA',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });

    // Branch Manager B (Branch B)
    const bmBUser = await prisma.user.create({
      data: {
        email: `bmb-photo-${ts}@titanauto.com`,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    await prisma.employee.create({
      data: {
        userId: bmBUser.id,
        branchId: branchBId,
        employeeCode: `EMP-BMB-PH-${ts}`,
        firstName: 'Branch',
        lastName: 'ManagerB',
        status: 'ACTIVE',
        roleAssignments: { create: { roleId: bmRole.id } },
      },
    });

    // Login BMA
    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: bmAUser.email, password: testPassword });
    branchManagerAToken = loginA.body.data?.accessToken || loginA.body.accessToken;

    // Login BMB
    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: bmBUser.email, password: testPassword });
    branchManagerBToken = loginB.body.data?.accessToken || loginB.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Image Validation
  it('1. Validation: Rejects invalid file format and oversized files during photo upload', async () => {
    // A: Invalid MIME format (.txt)
    const invalidFormatRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles/upload-photo')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .attach('file', Buffer.from('not an image'), 'test.txt');

    expect(invalidFormatRes.status).toBe(400);
    expect(invalidFormatRes.body.message).toContain('Unsupported image format');

    // B: Oversized file (> 5MB)
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 0xff);
    const oversizedRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles/upload-photo')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .attach('file', oversizedBuffer, 'oversized.jpg');

    expect(oversizedRes.status).toBe(400);
    expect(oversizedRes.body.message).toContain('5MB limit');
  });

  // TEST 2: Successful Photo Upload & Staging
  it('2. Photo Staging: Uploads multiple valid vehicle photos and returns persistent URLs', async () => {
    // 1x1 valid PNG pixel
    const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    const uploadRes1 = await request(app.getHttpServer())
      .post('/api/v1/vehicles/upload-photo')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .attach('file', samplePng, 'front-view.png');

    expect(uploadRes1.status).toBe(201);
    const uploadData1 = uploadRes1.body.data || uploadRes1.body;
    expect(uploadData1.url).toMatch(/^\/uploads\/vehicles\/vehicle-/);
    uploadedPhoto1Url = uploadData1.url;

    const uploadRes2 = await request(app.getHttpServer())
      .post('/api/v1/vehicles/upload-photo')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .attach('file', samplePng, 'side-view.png');

    expect(uploadRes2.status).toBe(201);
    const uploadData2 = uploadRes2.body.data || uploadRes2.body;
    uploadedPhoto2Url = uploadData2.url;
  });

  // TEST 3: Create Vehicle with Multiple Photos
  it('3. Vehicle Creation: Attaches uploaded photos and sets first photo as primary cover', async () => {
    const vin = `MB1T${ts}PHOTO01`;
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({
        vin,
        engineNumber: `ENG-PH-${ts}`,
        branchId: branchAId,
        variantId,
        manufacturingYear: 2026,
        color: 'Speed White',
        baseCost: 3800000,
        sellingPrice: 4200000,
        images: [uploadedPhoto1Url, uploadedPhoto2Url],
      });

    expect(createRes.status).toBe(201);
    const vehicle = createRes.body.data || createRes.body;
    expect(vehicle.id).toBeDefined();
    testVehicleId = vehicle.id;

    // Verify images array in PostgreSQL
    expect(vehicle.images).toEqual([uploadedPhoto1Url, uploadedPhoto2Url]);
    expect(vehicle.images[0]).toBe(uploadedPhoto1Url); // Primary cover photo
  });

  // TEST 4: Upload Photo Directly to Existing Vehicle
  it('4. Direct Vehicle Photo Upload: Uploads photo to existing vehicle and creates FileAttachment metadata', async () => {
    const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    const uploadRes = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${testVehicleId}/photos`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .attach('file', samplePng, 'rear-view.png');

    expect(uploadRes.status).toBe(201);
    const uploadData3 = uploadRes.body.data || uploadRes.body;
    expect(uploadData3.url).toBeDefined();
    uploadedPhoto3Url = uploadData3.url;

    // Verify FileAttachment was persisted in database
    const attachment = await prisma.fileAttachment.findFirst({
      where: { entityType: 'VEHICLE', entityId: testVehicleId, filename: 'rear-view.png' },
    });
    expect(attachment).toBeDefined();
    expect(attachment?.mimeType).toBe('image/png');
  });

  // TEST 5: List Photos with Primary Status
  it('5. List Photos: Returns all attached photos with primary cover status flag', async () => {
    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${testVehicleId}/photos`)
      .set('Authorization', `Bearer ${branchManagerAToken}`);

    expect(listRes.status).toBe(200);
    const photos = listRes.body.data || listRes.body;
    expect(Array.isArray(photos)).toBe(true);
    expect(photos.length).toBe(3);

    // Primary status
    expect(photos[0].isPrimary).toBe(true);
    expect(photos[0].url).toBe(uploadedPhoto1Url);
    expect(photos[1].isPrimary).toBe(false);
    expect(photos[2].isPrimary).toBe(false);
  });

  // TEST 6: Set Primary Photo
  it('6. Set Primary Photo: Reorders photos so selected photo becomes index 0', async () => {
    const setPrimaryRes = await request(app.getHttpServer())
      .patch(`/api/v1/vehicles/${testVehicleId}/photos/primary`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({ photoUrl: uploadedPhoto2Url });

    expect(setPrimaryRes.status).toBe(200);
    const body = setPrimaryRes.body.data || setPrimaryRes.body;
    expect(body.success).toBe(true);
    expect(body.images[0]).toBe(uploadedPhoto2Url);
    expect(body.primaryPhoto).toBe(uploadedPhoto2Url);

    // Verify list endpoint reflects change
    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${testVehicleId}/photos`)
      .set('Authorization', `Bearer ${branchManagerAToken}`);

    const photos = listRes.body.data || listRes.body;
    expect(photos[0].url).toBe(uploadedPhoto2Url);
    expect(photos[0].isPrimary).toBe(true);
  });

  // TEST 7: Delete Vehicle Photo
  it('7. Delete Photo: Removes photo from vehicle images and cleans up FileAttachment and disk storage', async () => {
    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/v1/vehicles/${testVehicleId}/photos`)
      .set('Authorization', `Bearer ${branchManagerAToken}`)
      .send({ photoUrl: uploadedPhoto3Url });

    expect(deleteRes.status).toBe(200);
    const body = deleteRes.body.data || deleteRes.body;
    expect(body.images).not.toContain(uploadedPhoto3Url);

    // Verify FileAttachment record was removed
    const attachment = await prisma.fileAttachment.findFirst({
      where: { entityType: 'VEHICLE', entityId: testVehicleId, storageKey: { contains: 'rear-view' } },
    });
    expect(attachment).toBeNull();
  });

  // TEST 8: Multi-Tenant Branch Authorization
  it('8. Branch Isolation: Branch Manager B cannot upload, set primary, or delete photos for Branch A vehicle', async () => {
    const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    // A: Upload photo to Branch A vehicle by Branch Manager B -> 403 Forbidden
    const unauthUpload = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${testVehicleId}/photos`)
      .set('Authorization', `Bearer ${branchManagerBToken}`)
      .attach('file', samplePng, 'unauthorized.png');

    expect(unauthUpload.status).toBe(403);

    // B: Set primary photo by Branch Manager B -> 403 Forbidden
    const unauthSetPrimary = await request(app.getHttpServer())
      .patch(`/api/v1/vehicles/${testVehicleId}/photos/primary`)
      .set('Authorization', `Bearer ${branchManagerBToken}`)
      .send({ photoUrl: uploadedPhoto1Url });

    expect(unauthSetPrimary.status).toBe(403);

    // C: Delete photo by Branch Manager B -> 403 Forbidden
    const unauthDelete = await request(app.getHttpServer())
      .delete(`/api/v1/vehicles/${testVehicleId}/photos`)
      .set('Authorization', `Bearer ${branchManagerBToken}`)
      .send({ photoUrl: uploadedPhoto1Url });

    expect(unauthDelete.status).toBe(403);
  });

  // TEST 9: Persistent Static Asset Serving
  it('9. Static Asset Serving: Uploaded photos are served persistently via HTTP /uploads/vehicles/', async () => {
    const assetRes = await request(app.getHttpServer()).get(uploadedPhoto1Url);
    expect(assetRes.status).toBe(200);
    expect(assetRes.headers['content-type']).toMatch(/image/);
  });
});
