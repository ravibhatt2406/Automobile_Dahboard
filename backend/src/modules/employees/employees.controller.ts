import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

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
