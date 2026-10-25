import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'SALES_EMPLOYEE',
    'SERVICE_ADVISOR',
    'CUSTOMER',
  )
  @ApiOperation({ summary: 'Create new customer record (Organisation staff, Super Admin, or Customer onboarding)' })
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: any) {
    return this.customersService.create(dto, user);
  }

  @Get()
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'SALES_EMPLOYEE',
    'SERVICE_ADVISOR',
    'DEPARTMENT_MANAGER',
  )
  @ApiOperation({ summary: 'Get paginated list of customers scoped by authorized branch or franchise' })
  async findAll(
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('customerType') customerType?: string,
    @Query('status') status?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @CurrentUser() user?: any,
  ) {
    return this.customersService.findAll(
      search,
      branchId,
      franchiseId,
      customerType,
      status,
      Number(limit),
      Number(offset),
      user,
    );
  }

  @Get(':id')
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'SALES_EMPLOYEE',
    'SERVICE_ADVISOR',
    'DEPARTMENT_MANAGER',
    'CUSTOMER',
  )
  @ApiOperation({ summary: 'Get customer details, complete 360 profile, bookings, & vehicles (scoped)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.customersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'Update customer details' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCustomerDto>,
    @CurrentUser() user: any,
  ) {
    return this.customersService.update(id, dto, user);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Deactivate customer while preserving historical relationships' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.customersService.deactivate(id, user);
  }
}
