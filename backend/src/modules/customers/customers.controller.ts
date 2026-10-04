import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new customer record' })
  async create(@Body() dto: CreateCustomerDto, @CurrentUser('id') actorUserId: string) {
    return this.customersService.create(dto, actorUserId);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of customers (supports search & franchise filter)' })
  async findAll(
    @Query('search') search?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.customersService.findAll(search, franchiseId, Number(limit), Number(offset));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details, complete 360 profile, bookings, & vehicles' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer details' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCustomerDto>,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.customersService.update(id, dto, actorUserId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate customer while preserving historical relationships' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.customersService.deactivate(id, actorUserId);
  }
}
