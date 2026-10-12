import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { BookingStatus } from '@prisma/client';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller(['bookings', 'sales/bookings'])
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Create new booking and reserve vehicle transactionally' })
  async create(@Body() dto: CreateBookingDto, @CurrentUser() user: any) {
    return this.bookingsService.create(dto, user);
  }

  @Get()
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'SALES_EMPLOYEE',
    'CUSTOMER',
  )
  @ApiOperation({ summary: 'Get list of bookings (filtered by branchId or status)' })
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('status') status?: BookingStatus,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @CurrentUser() user?: any,
  ) {
    return this.bookingsService.findAll(branchId, status, Number(limit), Number(offset), user);
  }

  @Get(':id')
  @Roles(
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'SALES_EMPLOYEE',
    'CUSTOMER',
  )
  @ApiOperation({ summary: 'Get full booking details, payments, finance, insurance & allocations' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.findOne(id, user);
  }

  @Post(':id/cancel')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Cancel booking and unreserve allocated vehicle transactionally' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.cancel(id, reason || 'Customer requested cancellation', user);
  }

  @Post(':id/allocate')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Allocate physical vehicle to booking' })
  async allocate(
    @Param('id') bookingId: string,
    @Body('vehicleId') vehicleId: string,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.allocateVehicle(vehicleId, bookingId, user);
  }
}
