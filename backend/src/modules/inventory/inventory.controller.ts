import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
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
  async create(@Body() dto: CreateVehicleDto, @CurrentUser('id') actorUserId: string) {
    return this.inventoryService.create(dto, actorUserId);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of physical vehicles in stock (filtered by branch or status)' })
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('status') status?: VehicleStatus,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.inventoryService.findAll(branchId, status, Number(limit), Number(offset));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get physical vehicle details, PDI history, & allocation' })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Update vehicle status with state-transition validation' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: VehicleStatus,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.inventoryService.updateStatus(id, status, actorUserId);
  }

  @Post(':id/allocate')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Allocate reserved vehicle to a customer booking' })
  async allocateVehicle(
    @Param('id') id: string,
    @Body('bookingId') bookingId: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.inventoryService.allocateVehicle(id, bookingId, actorUserId);
  }
}
