import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignExpenseDto } from './dto/create-campaign-expense.dto';
import { AddCampaignMemberDto } from './dto/add-campaign-member.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CampaignStatus } from '@prisma/client';

@ApiTags('Camps & Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'MARKETING_MANAGER')
  @ApiOperation({ summary: 'Create new marketing camp or campaign' })
  create(@Body() dto: CreateCampaignDto, @CurrentUser() user: any) {
    return this.campaignsService.create(dto, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'MARKETING_MANAGER')
  @ApiOperation({ summary: 'List marketing campaigns with search, status, and date filters' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: CampaignStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('status') status?: CampaignStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @CurrentUser() user?: any,
  ) {
    return this.campaignsService.findAll(
      branchId,
      franchiseId,
      status,
      search,
      startDate,
      endDate,
      +limit,
      +offset,
      user,
    );
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'MARKETING_MANAGER')
  @ApiOperation({ summary: 'Get campaign details with genuine performance metrics and expenses' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.campaignsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'MARKETING_MANAGER')
  @ApiOperation({ summary: 'Update campaign details, dates, budget or status' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.update(id, dto, user);
  }

  @Post(':id/expenses')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'MARKETING_MANAGER')
  @ApiOperation({ summary: 'Record actual campaign expense from receipt/voucher' })
  recordExpense(
    @Param('id') id: string,
    @Body() dto: CreateCampaignExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.recordExpense(id, dto, user);
  }

  @Post(':id/members')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'MARKETING_MANAGER')
  @ApiOperation({ summary: 'Assign employee to campaign team' })
  addMember(
    @Param('id') id: string,
    @Body() dto: AddCampaignMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.addMember(id, dto, user);
  }

  @Delete(':id/members/:employeeId')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'MARKETING_MANAGER')
  @ApiOperation({ summary: 'Remove employee from campaign team' })
  removeMember(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.removeMember(id, employeeId, user);
  }
}
