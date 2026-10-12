import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { ProcessApprovalDto } from './dto/process-approval.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get list of all employee approval requests' })
  async getAllRequests(
    @Query('branchId') branchId: string | undefined,
    @Query('franchiseId') franchiseId: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.findAll(branchId, franchiseId, user);
  }

  @Get('pending')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get list of pending employee approval requests' })
  async getPendingRequests(@CurrentUser() user: any) {
    return this.approvalsService.findAllPending(user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get approval request details by ID' })
  async getRequestById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.approvalsService.findOne(id, user);
  }

  @Post(':id/process')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Approve or Reject an employee onboarding request (Self-approval prevented)' })
  async processRequest(
    @Param('id') id: string,
    @Body() dto: ProcessApprovalDto,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.processRequest(id, dto, user);
  }
}
