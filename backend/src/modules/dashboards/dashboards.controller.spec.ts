import { Test, TestingModule } from '@nestjs/testing';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { PrismaService } from '@/database/prisma.service';
import { Reflector } from '@nestjs/core';

describe('DashboardsController Unit Tests', () => {
  let controller: DashboardsController;
  let service: DashboardsService;

  const mockDashboardsService = {
    getSuperAdminDashboard: jest.fn(),
    getFranchiseDashboard: jest.fn(),
    getBranchDashboard: jest.fn(),
    getSalesDashboard: jest.fn(),
    getServiceAdvisorDashboard: jest.fn(),
    getMechanicDashboard: jest.fn(),
    getCustomerDashboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardsController],
      providers: [
        { provide: DashboardsService, useValue: mockDashboardsService },
        { provide: PrismaService, useValue: {} },
        Reflector,
      ],
    }).compile();

    controller = module.get<DashboardsController>(DashboardsController);
    service = module.get<DashboardsService>(DashboardsService);
  });

  it('should call getSuperAdminDashboard', async () => {
    mockDashboardsService.getSuperAdminDashboard.mockResolvedValue({ franchiseCount: 5 });
    const result = await controller.getSuperAdminDashboard();
    expect(result).toEqual({ franchiseCount: 5 });
    expect(service.getSuperAdminDashboard).toHaveBeenCalled();
  });

  it('should call getFranchiseDashboard with queryFranchiseId and user', async () => {
    mockDashboardsService.getFranchiseDashboard.mockResolvedValue({ franchiseId: 'fran-1' });
    const user = { id: 'u1', roles: ['FRANCHISE_OWNER'], franchiseId: 'fran-1' };
    const result = await controller.getFranchiseDashboard('fran-1', user);
    expect(result).toEqual({ franchiseId: 'fran-1' });
    expect(service.getFranchiseDashboard).toHaveBeenCalledWith('fran-1', user);
  });

  it('should call getBranchDashboard with queryBranchId and user', async () => {
    mockDashboardsService.getBranchDashboard.mockResolvedValue({ branchId: 'br-1' });
    const user = { id: 'u2', roles: ['BRANCH_MANAGER'], branchId: 'br-1' };
    const result = await controller.getBranchDashboard('br-1', user);
    expect(result).toEqual({ branchId: 'br-1' });
    expect(service.getBranchDashboard).toHaveBeenCalledWith('br-1', user);
  });

  it('should call getSalesDashboard with user', async () => {
    mockDashboardsService.getSalesDashboard.mockResolvedValue({ openQuotationsCount: 3 });
    const user = { id: 'u3', roles: ['SALES_EMPLOYEE'], employeeId: 'emp-1' };
    const result = await controller.getSalesDashboard(user);
    expect(result).toEqual({ openQuotationsCount: 3 });
    expect(service.getSalesDashboard).toHaveBeenCalledWith(user);
  });

  it('should call getServiceAdvisorDashboard with user', async () => {
    mockDashboardsService.getServiceAdvisorDashboard.mockResolvedValue({ pendingAppointmentsCount: 4 });
    const user = { id: 'u4', roles: ['SERVICE_ADVISOR'], employeeId: 'emp-2' };
    const result = await controller.getServiceAdvisorDashboard(user);
    expect(result).toEqual({ pendingAppointmentsCount: 4 });
    expect(service.getServiceAdvisorDashboard).toHaveBeenCalledWith(user);
  });

  it('should call getMechanicDashboard with mechanic employee id', async () => {
    mockDashboardsService.getMechanicDashboard.mockResolvedValue({ totalAssigned: 6 });
    const user = { id: 'u5', roles: ['MECHANIC'], employeeId: 'mech-1' };
    const result = await controller.getMechanicDashboard(user);
    expect(result).toEqual({ totalAssigned: 6 });
    expect(service.getMechanicDashboard).toHaveBeenCalledWith('mech-1');
  });

  it('should call getCustomerDashboard with current customer user id', async () => {
    mockDashboardsService.getCustomerDashboard.mockResolvedValue({ id: 'c1' });
    const result = await controller.getCustomerDashboard('usr-cust-1');
    expect(result).toEqual({ id: 'c1' });
    expect(service.getCustomerDashboard).toHaveBeenCalledWith('usr-cust-1');
  });
});
