import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { VehicleStatus } from '@prisma/client';

@ApiTags('Physical Vehicle Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('vehicles')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Add new physical vehicle with VIN/chassis to inventory' })
  async create(@Body() dto: CreateVehicleDto, @CurrentUser() user: any) {
    return this.inventoryService.create(dto, user);
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
  @ApiOperation({ summary: 'Get list of physical vehicles in stock (filtered by branch, status, variant or search query)' })
  async findAll(
    @Query('branchId') branchId: string | undefined,
    @Query('status') status: VehicleStatus | undefined,
    @Query('variantId') variantId: string | undefined,
    @Query('search') search: string | undefined,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @CurrentUser() user?: any,
  ) {
    return this.inventoryService.findAll(branchId, status, variantId, search, Number(limit), Number(offset), user);
  }

  @Get('stock-summary')
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
  @ApiOperation({ summary: 'Get real stock counts and inventory metrics by status' })
  async getStockSummary(@Query('branchId') branchId?: string, @CurrentUser() user?: any) {
    return this.inventoryService.getStockSummary(branchId, user);
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
  @ApiOperation({ summary: 'Get physical vehicle details, PDI history, & allocation' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.inventoryService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Update vehicle status with state-transition validation' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: VehicleStatus,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.updateStatus(id, status, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Update physical vehicle details (color, pricing, images)' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateVehicleDto>,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Deactivate or safely delete physical vehicle from inventory' })
  async deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inventoryService.deactivate(id, user);
  }

  @Get(':id/history')
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'DEPARTMENT_MANAGER',
    'SALES_EMPLOYEE',
    'CUSTOMER',
  )
  @ApiOperation({ summary: 'Get vehicle complete status, allocation, PDI, and delivery lifecycle history' })
  async getHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inventoryService.getHistory(id, user);
  }

  @Post(':id/allocate')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Allocate reserved vehicle to a customer booking' })
  async allocateVehicle(
    @Param('id') id: string,
    @Body('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.allocateVehicle(id, bookingId, user);
  }
}
