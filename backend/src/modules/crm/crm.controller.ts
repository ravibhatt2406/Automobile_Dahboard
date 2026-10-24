import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateFollowUpDto } from './dto/create-followup.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { LeadStatus } from '@prisma/client';

@ApiTags('CRM & Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller(['leads', 'sales/leads', 'crm/leads'])
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Create new customer lead or enquiry' })
  async createLead(@Body() dto: CreateLeadDto, @CurrentUser() user: any) {
    return this.crmService.createLead(dto, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Get list of leads with view and search filters' })
  async findAllLeads(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('status') status?: LeadStatus,
    @Query('campaignId') campaignId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('view') view?: string,
    @Query('search') search?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @CurrentUser() user?: any,
  ) {
    return this.crmService.findAllLeads(
      branchId,
      status,
      Number(limit),
      Number(offset),
      user,
      franchiseId,
      startDate,
      endDate,
      campaignId,
      view,
      search,
    );
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Get lead details by ID' })
  async findOneLead(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.crmService.findOneLead(id, user);
  }

  @Post(':id/assign')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Assign or reassign lead to a sales employee (Manager/Admin Only)' })
  async assignLead(
    @Param('id') leadId: string,
    @Body('employeeId') employeeId: string,
    @CurrentUser() user: any,
  ) {
    return this.crmService.assignLead(leadId, employeeId, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Update lead details, requirements, budget, or assigned employee' })
  async updateLead(
    @Param('id') leadId: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.crmService.updateLead(leadId, dto, user);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Update lead status in lifecycle (NEW -> CONTACTED -> QUALIFIED -> etc.)' })
  async updateLeadStatus(
    @Param('id') leadId: string,
    @Body('status') status: LeadStatus,
    @Body('lostReason') lostReason: string,
    @CurrentUser() user: any,
  ) {
    return this.crmService.updateLeadStatus(leadId, status, user, lostReason);
  }

  @Post(':id/activities')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Record an activity on a lead (Call, Meeting, Note, Test Drive)' })
  async addActivity(
    @Param('id') leadId: string,
    @Body() dto: CreateLeadActivityDto,
    @CurrentUser() user: any,
  ) {
    return this.crmService.addActivity(leadId, dto, user);
  }

  @Get(':id/activities')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Get list of activity history on a lead' })
  async getActivities(@Param('id') leadId: string, @CurrentUser() user: any) {
    return this.crmService.getActivities(leadId, user);
  }

  @Post(':id/convert-customer')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Convert prospect lead to an active Customer record' })
  async convertProspectToCustomer(@Param('id') leadId: string, @CurrentUser() user: any) {
    return this.crmService.convertProspectToCustomer(leadId, user);
  }

  @Post(':id/follow-ups')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Schedule a follow-up action for a lead' })
  async addFollowUp(
    @Param('id') leadId: string,
    @Body() dto: CreateFollowUpDto,
    @CurrentUser() user: any,
  ) {
    return this.crmService.addFollowUp(leadId, dto, user);
  }

  @Patch('follow-ups/:followUpId/complete')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Mark a scheduled follow-up action as completed' })
  async completeFollowUp(@Param('followUpId') followUpId: string, @CurrentUser() user?: any) {
    return this.crmService.completeFollowUp(followUpId, user);
  }
}
