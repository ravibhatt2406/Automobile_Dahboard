import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServiceAppointmentsService } from './service-appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('Service Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller(['service-appointments', 'service/appointments'])
export class ServiceAppointmentsController {
  constructor(private readonly appointmentsService: ServiceAppointmentsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'CUSTOMER')
  @ApiOperation({ summary: 'Book service appointment' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.create(dto, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'CUSTOMER')
  @ApiOperation({ summary: 'List service appointments' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    return this.appointmentsService.findAll(branchId, customerId, status, limit ? +limit : 50, offset ? +offset : 0, user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'CUSTOMER')
  @ApiOperation({ summary: 'Get appointment details' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.appointmentsService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR')
  @ApiOperation({ summary: 'Update appointment status (Confirm / Check-in / Complete / Cancel)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
    @Body('serviceAdvisorId') serviceAdvisorId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.appointmentsService.updateStatus(id, status, serviceAdvisorId, user);
  }

  @Patch(':id/reschedule')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'CUSTOMER')
  @ApiOperation({ summary: 'Reschedule appointment' })
  reschedule(
    @Param('id') id: string,
    @Body('preferredDate') preferredDate: string,
    @Body('preferredTime') preferredTime?: string,
    @CurrentUser() user?: any,
  ) {
    return this.appointmentsService.reschedule(id, preferredDate, preferredTime, user);
  }
}
