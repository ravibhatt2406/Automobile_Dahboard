import { Test, TestingModule } from '@nestjs/testing';
import { DashboardsService } from './dashboards.service';
import { PrismaService } from '@/database/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('DashboardsService Unit & Scope Enforcement Tests', () => {
  let service: DashboardsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      franchise: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      branch: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      employee: {
        count: jest.fn(),
      },
      customer: {
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      vehicle: {
        count: jest.fn(),
      },
      booking: {
        count: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      serviceJob: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      serviceAppointment: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      employeeApprovalRequest: {
        count: jest.fn(),
      },
      quotation: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      lead: {
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardsService>(DashboardsService);
  });

  describe('1. Super Admin Dashboard', () => {
    it('should aggregate real database counts and revenue', async () => {
      prisma.franchise.count.mockResolvedValue(4);
      prisma.branch.count.mockResolvedValue(12);
      prisma.employee.count.mockResolvedValue(85);
      prisma.customer.count.mockResolvedValue(320);
      prisma.vehicle.count
        .mockResolvedValueOnce(150) // total
        .mockResolvedValueOnce(95); // in_stock
      prisma.booking.count.mockResolvedValue(210);
      prisma.serviceJob.count
        .mockResolvedValueOnce(180) // total
        .mockResolvedValueOnce(35); // active
      prisma.employeeApprovalRequest.count.mockResolvedValue(3);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 45000000 } });
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.branch.findMany.mockResolvedValue([]);

      const result = await service.getSuperAdminDashboard();

      expect(result.franchiseCount).toBe(4);
      expect(result.branchCount).toBe(12);
      expect(result.employeeCount).toBe(85);
      expect(result.customerCount).toBe(320);
      expect(result.vehicleCount).toBe(150);
      expect(result.inStockVehicleCount).toBe(95);
      expect(result.bookingCount).toBe(210);
      expect(result.serviceJobCount).toBe(180);
      expect(result.activeServiceJobCount).toBe(35);
      expect(result.pendingApprovals).toBe(3);
      expect(result.totalRevenue).toBe(45000000);
    });
  });

  describe('2. Franchise Owner / Manager Dashboard & Scope Enforcement', () => {
    it('should return metrics for authorized franchise', async () => {
      const user = {
        id: 'usr-1',
        roles: ['FRANCHISE_OWNER'],
        franchiseId: 'fran-1',
      };

      prisma.franchise.findUnique.mockResolvedValue({
        id: 'fran-1',
        name: 'Apex Trucks South',
        code: 'FRAN-APX-S',
        branches: [],
      });
      prisma.branch.count.mockResolvedValue(3);
      prisma.employee.count.mockResolvedValue(25);
      prisma.employeeApprovalRequest.count.mockResolvedValue(1);
      prisma.vehicle.count
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(25);
      prisma.booking.count.mockResolvedValue(60);
      prisma.serviceJob.count.mockResolvedValue(15);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 18000000 } });
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await service.getFranchiseDashboard('fran-1', user);

      expect(result.franchiseId).toBe('fran-1');
      expect(result.franchiseName).toBe('Apex Trucks South');
      expect(result.branchCount).toBe(3);
      expect(result.employeeCount).toBe(25);
      expect(result.totalRevenue).toBe(18000000);
    });

    it('should block cross-franchise access attempt for Franchise Owner', async () => {
      const user = {
        id: 'usr-1',
        roles: ['FRANCHISE_OWNER'],
        franchiseId: 'fran-1',
      };

      await expect(service.getFranchiseDashboard('fran-2', user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('3. Branch Dashboard & Scope Enforcement', () => {
    it('should return branch metrics for authorized Branch Manager', async () => {
      const user = {
        id: 'usr-bm',
        roles: ['BRANCH_MANAGER'],
        branchId: 'br-1',
      };

      prisma.branch.findUnique.mockResolvedValue({
        id: 'br-1',
        name: 'Chennai Central Hub',
        code: 'BR-CHN-01',
        city: 'Chennai',
        franchise: { id: 'fran-1', name: 'Apex Trucks South', code: 'FRAN-APX-S' },
      });
      prisma.vehicle.count
        .mockResolvedValueOnce(18) // in stock
        .mockResolvedValueOnce(25); // total
      prisma.booking.count
        .mockResolvedValueOnce(15) // confirmed
        .mockResolvedValueOnce(20); // total
      prisma.serviceJob.count
        .mockResolvedValueOnce(8) // active
        .mockResolvedValueOnce(45); // completed
      prisma.employee.count.mockResolvedValue(12);
      prisma.employeeApprovalRequest.count.mockResolvedValue(0);
      prisma.quotation.count.mockResolvedValue(10);
      prisma.lead.count.mockResolvedValue(22);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 8500000 } });
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.serviceJob.findMany.mockResolvedValue([]);

      const result = await service.getBranchDashboard('br-1', user);

      expect(result.branchId).toBe('br-1');
      expect(result.branchName).toBe('Chennai Central Hub');
      expect(result.inStockVehicles).toBe(18);
      expect(result.confirmedBookings).toBe(15);
      expect(result.activeServiceJobs).toBe(8);
      expect(result.totalEmployees).toBe(12);
      expect(result.totalRevenue).toBe(8500000);
    });

    it('should block cross-branch access attempt for Branch Manager', async () => {
      const user = {
        id: 'usr-bm',
        roles: ['BRANCH_MANAGER'],
        branchId: 'br-1',
      };

      await expect(service.getBranchDashboard('br-2', user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should block Franchise Manager if requested branch belongs to another franchise', async () => {
      const user = {
        id: 'usr-fm',
        roles: ['FRANCHISE_MANAGER'],
        franchiseId: 'fran-1',
      };

      prisma.branch.findUnique.mockResolvedValue({
        id: 'br-99',
        franchiseId: 'fran-OTHER',
        name: 'Unrelated Branch',
      });

      await expect(service.getBranchDashboard('br-99', user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('4. Sales Dashboard & Workload', () => {
    it('should scope sales metrics to salespersonEmployeeId for SALES_EMPLOYEE', async () => {
      const user = {
        id: 'usr-sales',
        roles: ['SALES_EMPLOYEE'],
        employeeId: 'emp-sales-1',
        branchId: 'br-1',
      };

      prisma.quotation.count.mockResolvedValue(7);
      prisma.booking.count
        .mockResolvedValueOnce(5) // confirmed
        .mockResolvedValueOnce(8); // total
      prisma.vehicle.count.mockResolvedValue(18);
      prisma.lead.count.mockResolvedValue(14);
      prisma.quotation.findMany.mockResolvedValue([]);
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await service.getSalesDashboard(user);

      expect(result.openQuotationsCount).toBe(7);
      expect(result.confirmedBookingsCount).toBe(5);
      expect(result.totalBookingsCount).toBe(8);
      expect(result.availableStockCount).toBe(18);
      expect(result.activeLeadsCount).toBe(14);

      expect(prisma.quotation.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            salespersonEmployeeId: 'emp-sales-1',
          }),
        }),
      );
    });
  });

  describe('5. Service Advisor Dashboard', () => {
    it('should return service appointments and active job metrics for branch', async () => {
      const user = {
        id: 'usr-adv',
        roles: ['SERVICE_ADVISOR'],
        employeeId: 'emp-adv-1',
        branchId: 'br-1',
      };

      prisma.serviceAppointment.count.mockResolvedValue(6);
      prisma.serviceJob.count
        .mockResolvedValueOnce(9) // active
        .mockResolvedValueOnce(30) // completed
        .mockResolvedValueOnce(2); // pending QC
      prisma.serviceAppointment.findMany.mockResolvedValue([]);
      prisma.serviceJob.findMany.mockResolvedValue([]);

      const result = await service.getServiceAdvisorDashboard(user);

      expect(result.pendingAppointmentsCount).toBe(6);
      expect(result.activeJobsCount).toBe(9);
      expect(result.completedJobsCount).toBe(30);
      expect(result.pendingQcCount).toBe(2);
    });
  });

  describe('6. Mechanic Dashboard & Job Isolation', () => {
    it('should return only assigned repair jobs for mechanic', async () => {
      const mechanicEmployeeId = 'mech-emp-42';

      prisma.serviceJob.findMany.mockResolvedValue([
        { id: 'job-1', status: 'IN_PROGRESS', diagnoses: [], jobParts: [{ id: 'p1' }] },
        { id: 'job-2', status: 'DIAGNOSIS', diagnoses: [], jobParts: [] },
        { id: 'job-3', status: 'CHECKED_IN', diagnoses: [], jobParts: [] },
        { id: 'job-4', status: 'COMPLETED', diagnoses: [], jobParts: [] },
      ]);

      const result = await service.getMechanicDashboard(mechanicEmployeeId);

      expect(result.totalAssigned).toBe(4);
      expect(result.activeJobsCount).toBe(2);
      expect(result.pendingJobsCount).toBe(1);
      expect(result.completedJobsCount).toBe(1);
      expect(result.partsRequestedCount).toBe(1);

      expect(prisma.serviceJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assignedMechanicId: mechanicEmployeeId },
        }),
      );
    });
  });

  describe('7. Customer Dashboard & Ownership Scoping', () => {
    it('should return owned vehicles, quotations, bookings, and calculated spent', async () => {
      const userId = 'usr-cust-99';

      prisma.user.findUnique.mockResolvedValue({ id: userId, email: 'fleet@logistics.com' });
      prisma.customer.findFirst.mockResolvedValue({
        id: 'cust-99',
        userId,
        name: 'Falcon Logistics Fleet',
        vehicles: [{ id: 'veh-1' }, { id: 'veh-2' }],
        quotations: [{ id: 'q-1', status: 'APPROVED' }, { id: 'q-2', status: 'REJECTED' }],
        bookings: [{ id: 'b-1', status: 'CONFIRMED' }],
        serviceAppointments: [{ id: 'apt-1' }],
        serviceJobs: [{ id: 'sj-1', status: 'IN_PROGRESS' }, { id: 'sj-2', status: 'COMPLETED' }],
        insurancePolicies: [{ id: 'pol-1' }],
        invoices: [
          { id: 'inv-1', totalAmount: '2400000', paymentStatus: 'PAID' },
          { id: 'inv-2', totalAmount: '1800000', paymentStatus: 'UNPAID' },
        ],
      });

      const result = await service.getCustomerDashboard(userId);

      expect(result.id).toBe('cust-99');
      expect(result.name).toBe('Falcon Logistics Fleet');
      expect(result.summary.vehiclesCount).toBe(2);
      expect(result.summary.activeQuotationsCount).toBe(1); // Excludes REJECTED
      expect(result.summary.bookingsCount).toBe(1);
      expect(result.summary.serviceDueCount).toBe(1); // Excludes COMPLETED
      expect(result.summary.totalSpent).toBe(2400000); // Only PAID invoice
    });
  });
});
