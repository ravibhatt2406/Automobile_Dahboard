import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
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
@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Create new booking and reserve vehicle transactionally' })
  async create(@Body() dto: CreateBookingDto, @CurrentUser('id') actorUserId: string) {
    return this.bookingsService.create(dto, actorUserId);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of bookings (filtered by branchId or status)' })
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('status') status?: BookingStatus,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.bookingsService.findAll(branchId, status, Number(limit), Number(offset));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full booking details, payments, finance, insurance & allocations' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post(':id/cancel')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Cancel booking and unreserve allocated vehicle transactionally' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.bookingsService.cancel(id, reason || 'Customer requested cancellation', actorUserId);
  }
}
