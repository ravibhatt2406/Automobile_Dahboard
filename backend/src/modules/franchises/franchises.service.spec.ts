import { Test, TestingModule } from '@nestjs/testing';
import { FranchisesService } from './franchises.service';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('FranchisesService', () => {
  let service: FranchisesService;
  let prisma: any;
  let auditService: any;
  const mockActorId = 'usr-admin-123';

  const mockBranch = {
    id: 'br-1',
    code: 'BR-JAI-01',
    name: 'Ashok Leyland — Jaipur',
    franchiseId: 'fr-1',
    address: 'Transport Nagar, Agra Road',
    city: 'Jaipur',
    state: 'Rajasthan',
    phone: '+919829000201',
    email: 'jaipur@ashok.com',
    status: 'ACTIVE',
    employees: [
      {
        id: 'emp-1',
        firstName: 'Anand',
        lastName: 'Agrawal',
        designation: 'General Manager',
        user: {
          id: 'usr-1',
          name: 'Anand Agrawal',
          email: 'franchise.ashok@titanauto.com',
          phone: '+919829000201',
        },
        roleAssignments: [
          {
            role: { name: 'FRANCHISE_OWNER' },
          },
        ],
      },
    ],
  };

  const mockFranchise = {
    id: 'fr-1',
    code: 'FR-AL-01',
    name: 'Ashok Leyland Commercial Vehicles',
    legalName: 'Ashok Leyland Dealership Network Pvt Ltd',
    taxId: '08AAAAA0000A1Z5',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    branches: [mockBranch],
  };

  beforeEach(async () => {
    prisma = {
      franchise: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FranchisesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<FranchisesService>(FranchisesService);
  });

  describe('create franchise', () => {
    it('should create franchise with normalized code and status', async () => {
      prisma.franchise.findUnique.mockResolvedValue(null);
      prisma.franchise.create.mockResolvedValue({
        id: 'fr-new',
        code: 'FR-VOLVO-01',
        name: 'Volvo Commercial Vehicles',
        legalName: 'Volvo Commercial Pvt Ltd',
        taxId: '08BBBBB1111B1Z2',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        branches: [],
      });

      const result = await service.create(
        {
          code: 'fr-volvo-01',
          name: 'Volvo Commercial Vehicles',
          legalName: 'Volvo Commercial Pvt Ltd',
          taxId: '08BBBBB1111B1Z2',
          brand: 'Volvo',
          status: 'ACTIVE',
        },
        mockActorId,
      );

      expect(prisma.franchise.findUnique).toHaveBeenCalledWith({
        where: { code: 'FR-VOLVO-01' },
      });
      expect(prisma.franchise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'FR-VOLVO-01',
            name: 'Volvo Commercial Vehicles',
            status: 'ACTIVE',
          }),
        }),
      );
      expect(result).not.toBeNull();
      expect(result!.code).toBe('FR-VOLVO-01');
      expect(result!.totalBranches).toBe(0);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should reject duplicate franchise code with ConflictException', async () => {
      prisma.franchise.findUnique.mockResolvedValue(mockFranchise);

      await expect(
        service.create(
          {
            code: 'FR-AL-01',
            name: 'Duplicate AL',
          },
          mockActorId,
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.franchise.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne and details retrieval', () => {
    it('should find franchise by code or id and enrich with owner and branches', async () => {
      prisma.franchise.findFirst.mockResolvedValue(mockFranchise);

      const result = await service.findOne('FR-AL-01');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('fr-1');
      expect(result!.code).toBe('FR-AL-01');
      expect(result!.brand).toBe('Ashok Leyland');
      expect(result!.ownerName).toBe('Anand Agrawal');
      expect(result!.contactEmail).toBe('franchise.ashok@titanauto.com');
      expect(result!.contactPhone).toBe('+919829000201');
      expect(result!.totalBranches).toBe(1);
      expect(result!.branches).toHaveLength(1);
      expect(result!.branches[0].code).toBe('BR-JAI-01');
    });

    it('should throw NotFoundException if franchise is not found', async () => {
      prisma.franchise.findFirst.mockResolvedValue(null);

      await expect(service.findOne('NON-EXISTENT')).rejects.toThrow(NotFoundException);
    });

    it('should enforce multi-tenant scope violation when user belongs to different franchise', async () => {
      prisma.franchise.findFirst.mockResolvedValue(mockFranchise);

      const restrictedUser = {
        id: 'usr-restricted',
        roles: ['FRANCHISE_MANAGER'],
        assignedFranchiseId: 'different-fr-id',
      };

      await expect(service.findOne('FR-AL-01', restrictedUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update franchise', () => {
    it('should update franchise fields and preserve immutable code', async () => {
      prisma.franchise.findFirst.mockResolvedValue(mockFranchise);
      prisma.franchise.update.mockResolvedValue({
        ...mockFranchise,
        name: 'Ashok Leyland Commercial Network',
        legalName: 'Ashok Leyland Updated Legal Name',
      });

      const result = await service.update(
        'fr-1',
        {
          name: 'Ashok Leyland Commercial Network',
          legalName: 'Ashok Leyland Updated Legal Name',
          code: 'TRY_TO_CHANGE_CODE', // Should not override franchise code
        } as any,
        mockActorId,
      );

      expect(prisma.franchise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'fr-1' },
          data: expect.objectContaining({
            name: 'Ashok Leyland Commercial Network',
            legalName: 'Ashok Leyland Updated Legal Name',
          }),
        }),
      );
      // Verify code was NOT in the update payload
      const updateCall = prisma.franchise.update.mock.calls[0][0];
      expect(updateCall.data.code).toBeUndefined();
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Ashok Leyland Commercial Network');
    });

    it('should throw NotFoundException when updating non-existent franchise', async () => {
      prisma.franchise.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Test' }, mockActorId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll franchises', () => {
    it('should return enriched franchises with totalBranches and branch list', async () => {
      prisma.franchise.findMany.mockResolvedValue([mockFranchise]);

      const results = await service.findAll();

      expect(results).toHaveLength(1);
      expect(results[0]).not.toBeNull();
      expect(results[0]!.totalBranches).toBe(1);
      expect(results[0]!.branches[0].name).toBe('Ashok Leyland — Jaipur');
      expect(results[0]!.ownerName).toBe('Anand Agrawal');
    });
  });
});
