import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { ProcessApprovalAction } from '../approvals/dto/process-approval.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly approvalsService: ApprovalsService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Create new employee account (Server-side RBAC Validated)' })
  async create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.create(dto, user);
  }

  @Get('approval-requests')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get list of pending employee approval requests' })
  async getApprovalRequests(@CurrentUser() user: any) {
    return this.approvalsService.findAllPending(user);
  }

  @Post('approval-requests/:id/approve')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Approve an employee onboarding request' })
  async approveRequest(@Param('id') id: string, @CurrentUser() user: any) {
    return this.approvalsService.processRequest(
      id,
      { action: ProcessApprovalAction.APPROVE },
      user,
    );
  }

  @Post('approval-requests/:id/reject')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Reject an employee onboarding request' })
  async rejectRequest(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.processRequest(
      id,
      { action: ProcessApprovalAction.REJECT, rejectionReason },
      user,
    );
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get list of employees (filtered by branchId or franchiseId)' })
  async findAll(
    @Query('branchId') branchId: string | undefined,
    @Query('franchiseId') franchiseId: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.findAll(branchId, franchiseId, user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get employee details by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.findOne(id, user);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Deactivate employee account (Preserves historical data)' })
  async deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.deactivate(id, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Update employee details (Branch transfer forbidden)' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmployeeDto>,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.update(id, dto, user);
  }

  @Post(':id/roles')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Assign an additional role to an existing employee in the same branch' })
  async assignRole(
    @Param('id') id: string,
    @Body('roleName') roleName: string,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.assignRole(id, roleName, user);
  }
}
