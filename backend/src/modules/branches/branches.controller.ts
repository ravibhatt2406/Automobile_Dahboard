import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create new branch under a franchise (Super Admin Only)' })
  async create(@Body() dto: CreateBranchDto, @CurrentUser() user: any) {
    return this.branchesService.create(dto, user);
  }

  @Get()
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'DEPARTMENT_MANAGER',
    'SALES_EMPLOYEE',
    'SERVICE_ADVISOR',
    'MECHANIC',
    'EMPLOYEE',
  )
  @ApiOperation({ summary: 'Get list of branches (optionally filtered by franchiseId)' })
  async findAll(@Query('franchiseId') franchiseId: string | undefined, @CurrentUser() user: any) {
    return this.branchesService.findAll(franchiseId, user);
  }

  @Get(':id')
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'DEPARTMENT_MANAGER',
    'SALES_EMPLOYEE',
    'SERVICE_ADVISOR',
    'MECHANIC',
    'EMPLOYEE',
  )
  @ApiOperation({ summary: 'Get branch details by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.branchesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Update branch details (Super Admin / Franchise Owner / Branch Manager)' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBranchDto>,
    @CurrentUser() user: any,
  ) {
    return this.branchesService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER')
  @ApiOperation({ summary: 'Activate or deactivate branch (Super Admin / Franchise Owner Only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.branchesService.updateStatus(id, status, user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER')
  @ApiOperation({ summary: 'Delete empty branch without historical records (Super Admin / Franchise Owner)' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.branchesService.delete(id, user);
  }
}
