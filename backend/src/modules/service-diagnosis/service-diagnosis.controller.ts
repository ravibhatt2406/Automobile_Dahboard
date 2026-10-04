import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceDiagnosisService } from './service-diagnosis.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Service Diagnosis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('')
export class ServiceDiagnosisController {
  constructor(private readonly diagnosisService: ServiceDiagnosisService) {}

  @Post('service-jobs/:id/diagnosis')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC')
  @ApiOperation({ summary: 'Record diagnosis for service job' })
  createForJob(
    @Param('id') serviceJobId: string,
    @Body() dto: CreateDiagnosisDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    dto.serviceJobId = serviceJobId;
    return this.diagnosisService.create(dto, actorUserId);
  }

  @Get('service-jobs/:id/diagnosis')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'CUSTOMER')
  @ApiOperation({ summary: 'Get diagnoses for service job' })
  findByJob(@Param('id') serviceJobId: string) {
    return this.diagnosisService.findByJob(serviceJobId);
  }

  @Patch('service-approvals/:id/respond')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'CUSTOMER')
  @ApiOperation({ summary: 'Customer approve or reject additional diagnosis work estimate' })
  respondApproval(
    @Param('id') approvalId: string,
    @Body('decision') decision: 'APPROVED' | 'REJECTED',
    @Body('customerNotes') customerNotes?: string,
    @CurrentUser('id') actorUserId?: string,
  ) {
    return this.diagnosisService.respondToApproval(approvalId, decision, customerNotes, actorUserId);
  }
}
