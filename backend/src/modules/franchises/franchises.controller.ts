import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FranchisesService } from './franchises.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Franchises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('franchises')
export class FranchisesController {
  constructor(private readonly franchisesService: FranchisesService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create new franchise (Super Admin Only)' })
  async create(@Body() dto: CreateFranchiseDto, @CurrentUser('id') actorUserId: string) {
    return this.franchisesService.create(dto, actorUserId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER')
  @ApiOperation({ summary: 'Get list of all franchises (Scoped by user privileges)' })
  async findAll(@CurrentUser() user: any) {
    return this.franchisesService.findAll(user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER')
  @ApiOperation({ summary: 'Get franchise details by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.franchisesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update franchise details (Super Admin Only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFranchiseDto>,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.franchisesService.update(id, dto, actorUserId);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Activate or deactivate franchise (Super Admin Only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.franchisesService.updateStatus(id, status, actorUserId);
  }
}
