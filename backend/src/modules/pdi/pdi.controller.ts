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
import { PdiService } from './pdi.service';
import { CreatePdiDto } from './dto/create-pdi.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('PDI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('')
export class PdiController {
  constructor(private readonly pdiService: PdiService) {}

  @Post('vehicles/:id/pdi')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'PDI_INSPECTOR', 'SERVICE_ENGINEER')
  @ApiOperation({ summary: 'Create PDI inspection for vehicle' })
  createForVehicle(
    @Param('id') vehicleId: string,
    @Body() dto: CreatePdiDto,
    @CurrentUser('id') inspectorUserId: string,
  ) {
    dto.vehicleId = vehicleId;
    return this.pdiService.create(dto, inspectorUserId);
  }

  @Post('pdi')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'PDI_INSPECTOR', 'SERVICE_ENGINEER')
  @ApiOperation({ summary: 'Create PDI inspection' })
  create(
    @Body() dto: CreatePdiDto,
    @CurrentUser('id') inspectorUserId: string,
  ) {
    return this.pdiService.create(dto, inspectorUserId);
  }

  @Get('pdi')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'PDI_INSPECTOR', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'List all PDI inspections' })
  findAll() {
    return this.pdiService.findAll();
  }

  @Patch('pdi/:id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'PDI_INSPECTOR', 'SERVICE_ENGINEER')
  @ApiOperation({ summary: 'Update PDI inspection / Reinspection' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePdiDto>,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.pdiService.update(id, dto, actorUserId);
  }

  @Get('vehicles/:id/pdi')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'PDI_INSPECTOR', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Get PDI inspections for vehicle' })
  findByVehicle(@Param('id') vehicleId: string) {
    return this.pdiService.findByVehicle(vehicleId);
  }

  @Get('pdi/:id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'PDI_INSPECTOR', 'SALES_EMPLOYEE')
  @ApiOperation({ summary: 'Get PDI inspection details' })
  findOne(@Param('id') id: string) {
    return this.pdiService.findOne(id);
  }
}
