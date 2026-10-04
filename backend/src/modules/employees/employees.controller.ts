import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { ProcessApprovalAction } from '../approvals/dto/process-approval.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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
    @CurrentUser('id') actorUserId: string,
    @CurrentUser('roles') actorRoles: string[],
  ) {
    return this.employeesService.create(dto, actorUserId, actorRoles);
  }

  @Get('approval-requests')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get list of pending employee approval requests' })
  async getApprovalRequests() {
    return this.approvalsService.findAllPending();
  }

  @Post('approval-requests/:id/approve')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Approve an employee onboarding request' })
  async approveRequest(@Param('id') id: string, @CurrentUser('id') approverUserId: string) {
    return this.approvalsService.processRequest(
      id,
      { action: ProcessApprovalAction.APPROVE },
      approverUserId,
    );
  }

  @Post('approval-requests/:id/reject')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Reject an employee onboarding request' })
  async rejectRequest(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @CurrentUser('id') approverUserId: string,
  ) {
    return this.approvalsService.processRequest(
      id,
      { action: ProcessApprovalAction.REJECT, rejectionReason },
      approverUserId,
    );
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get list of employees (filtered by branchId or franchiseId)' })
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
  ) {
    return this.employeesService.findAll(branchId, franchiseId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get employee details by ID' })
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Deactivate employee account (Preserves historical data)' })
  async deactivate(@Param('id') id: string, @CurrentUser('id') actorUserId: string) {
    return this.employeesService.deactivate(id, actorUserId);
  }
}
