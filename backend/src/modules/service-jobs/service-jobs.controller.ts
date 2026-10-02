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
@Controller('api/v1/service-jobs')
export class ServiceJobsController {
  constructor(private readonly serviceJobsService: ServiceJobsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR')
  @ApiOperation({ summary: 'Create service job card' })
  create(@Body() dto: CreateJobCardDto, @CurrentUser('id') actorUserId: string) {
    return this.serviceJobsService.create(dto, actorUserId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'CUSTOMER')
  @ApiOperation({ summary: 'List service jobs' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ServiceJobStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: ServiceJobStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.serviceJobsService.findAll(branchId, customerId, status, limit ? +limit : 50, offset ? +offset : 0);
  }

  @Get('mechanic/my-jobs')
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Get assigned jobs for mechanic dashboard' })
  findMyJobs(@CurrentUser('employeeId') mechanicEmployeeId: string, @Query('status') status?: ServiceJobStatus) {
    return this.serviceJobsService.findByMechanic(mechanicEmployeeId, status);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'CUSTOMER')
  @ApiOperation({ summary: 'Get full service job details' })
  findOne(@Param('id') id: string) {
    return this.serviceJobsService.findOne(id);
  }

  @Patch(':id/assign-mechanic')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR')
  @ApiOperation({ summary: 'Assign mechanic to service job' })
  assignMechanic(
    @Param('id') id: string,
    @Body('mechanicId') mechanicId: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.serviceJobsService.assignMechanic(id, mechanicId, actorUserId);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC')
  @ApiOperation({ summary: 'Update service job status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ServiceJobStatus,
    @Body('notes') notes: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.serviceJobsService.updateStatus(id, status, actorUserId, notes);
  }
}
