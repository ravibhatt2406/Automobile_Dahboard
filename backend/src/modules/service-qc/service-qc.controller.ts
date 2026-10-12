import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceQcService } from './service-qc.service';
import { CreateServiceQcDto } from './dto/create-service-qc.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Service Quality Control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('')
export class ServiceQcController {
  constructor(private readonly qcService: ServiceQcService) {}

  @Post('service-jobs/:id/qc')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'PDI_INSPECTOR')
  @ApiOperation({ summary: 'Perform Quality Control inspection on service job' })
  createForJob(
    @Param('id') serviceJobId: string,
    @Body() dto: CreateServiceQcDto,
    @CurrentUser('id') inspectorUserId: string,
    @CurrentUser() user: any,
  ) {
    dto.serviceJobId = serviceJobId;
    return this.qcService.create(dto, inspectorUserId, user);
  }

  @Get('service-jobs/:id/qc')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'PDI_INSPECTOR', 'MECHANIC', 'CUSTOMER')
  @ApiOperation({ summary: 'Get QC inspection records for service job' })
  findByJob(@Param('id') serviceJobId: string, @CurrentUser() user: any) {
    return this.qcService.findByJob(serviceJobId, user);
  }
}
