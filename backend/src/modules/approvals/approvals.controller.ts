import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { ProcessApprovalDto } from './dto/process-approval.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get list of pending employee approval requests' })
  async getPendingRequests() {
    return this.approvalsService.findAllPending();
  }

  @Post(':id/process')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Approve or Reject an employee onboarding request (Self-approval prevented)' })
  async processRequest(
    @Param('id') id: string,
    @Body() dto: ProcessApprovalDto,
    @CurrentUser('id') approverUserId: string,
  ) {
    return this.approvalsService.processRequest(id, dto, approverUserId);
  }
}
