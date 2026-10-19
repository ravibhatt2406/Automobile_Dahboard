import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { DeliveryStatus } from '@prisma/client';

@ApiTags('Deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller(['deliveries', 'delivery'])
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'DELIVERY_EXECUTIVE', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Create and complete vehicle delivery' })
  create(@Body() dto: CreateDeliveryDto, @CurrentUser('id') actorUserId: string) {
    return this.deliveriesService.create(dto, actorUserId);
  }

  @Post(':id/complete')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'DELIVERY_EXECUTIVE')
  @ApiOperation({ summary: 'Complete delivery processing' })
  complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.deliveriesService.findOne(id, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'DELIVERY_EXECUTIVE', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'List deliveries' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: DeliveryStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('status') status?: DeliveryStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    return this.deliveriesService.findAll(status, limit ? +limit : 50, offset ? +offset : 0, user, branchId, franchiseId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'DELIVERY_EXECUTIVE', 'SALES_EMPLOYEE', 'CUSTOMER')
  @ApiOperation({ summary: 'Get delivery details' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.deliveriesService.findOne(id, user);
  }
}
