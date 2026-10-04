import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceLabourService } from './service-labour.service';
import { CreateLabourDto } from './dto/create-labour.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Service Labour')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('')
export class ServiceLabourController {
  constructor(private readonly labourService: ServiceLabourService) {}

  @Post('service-jobs/:id/labour')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC')
  @ApiOperation({ summary: 'Add labour charge item to service job' })
  createForJob(
    @Param('id') serviceJobId: string,
    @Body() dto: CreateLabourDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    dto.serviceJobId = serviceJobId;
    return this.labourService.create(dto, actorUserId);
  }

  @Get('service-jobs/:id/labour')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'CUSTOMER')
  @ApiOperation({ summary: 'List labour items for service job' })
  findByJob(@Param('id') serviceJobId: string) {
    return this.labourService.findByJob(serviceJobId);
  }
}
