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
import { ServiceJobsService } from './service-jobs.service';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ServiceJobStatus } from '@prisma/client';

@ApiTags('Service Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller(['service-jobs', 'service/jobs'])
export class ServiceJobsController {
  constructor(private readonly serviceJobsService: ServiceJobsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR')
  @ApiOperation({ summary: 'Create service job card' })
  create(@Body() dto: CreateJobCardDto, @CurrentUser() user: any) {
    return this.serviceJobsService.create(dto, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'CUSTOMER')
  @ApiOperation({ summary: 'List service jobs' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ServiceJobStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: ServiceJobStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    return this.serviceJobsService.findAll(
      branchId,
      customerId,
      status,
      search,
      limit ? +limit : 50,
      offset ? +offset : 0,
      user,
      franchiseId,
      startDate,
      endDate,
    );
  }

  @Get('mechanic/my-jobs')
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Get assigned jobs for mechanic dashboard' })
  findMyJobs(
    @CurrentUser() user: any,
    @Query('mechanicId') requestedMechanicId?: string,
    @Query('status') status?: ServiceJobStatus,
  ) {
    return this.serviceJobsService.findByMechanic(user, requestedMechanicId, status);
  }

  @Get('vehicle/:vehicleId')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'CUSTOMER')
  @ApiOperation({ summary: 'Get comprehensive service history for vehicle' })
  getVehicleServiceHistory(@Param('vehicleId') vehicleId: string, @CurrentUser() user: any) {
    return this.serviceJobsService.getVehicleServiceHistory(vehicleId, user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'CUSTOMER')
  @ApiOperation({ summary: 'Get full service job details' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.serviceJobsService.findOne(id, user);
  }

  @Patch(':id/assign-mechanic')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR')
  @ApiOperation({ summary: 'Assign mechanic to service job' })
  assignMechanic(
    @Param('id') id: string,
    @Body('mechanicId') mechanicId: string,
    @CurrentUser() user: any,
  ) {
    return this.serviceJobsService.assignMechanic(id, mechanicId, user);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC')
  @ApiOperation({ summary: 'Update service job status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ServiceJobStatus,
    @Body('notes') notes: string,
    @CurrentUser() user: any,
  ) {
    return this.serviceJobsService.updateStatus(id, status, user, notes);
  }
}
