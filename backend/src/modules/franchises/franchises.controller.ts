import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FranchisesService } from './franchises.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Franchises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/franchises')
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
  @ApiOperation({ summary: 'Get list of all franchises' })
  async findAll() {
    return this.franchisesService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER')
  @ApiOperation({ summary: 'Get franchise details by ID' })
  async findOne(@Param('id') id: string) {
    return this.franchisesService.findOne(id);
  }
}
