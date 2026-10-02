import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER')
  @ApiOperation({ summary: 'Create new branch under a franchise (Super Admin / Franchise Owner)' })
  async create(@Body() dto: CreateBranchDto, @CurrentUser('id') actorUserId: string) {
    return this.branchesService.create(dto, actorUserId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get list of branches (optionally filtered by franchiseId)' })
  async findAll(@Query('franchiseId') franchiseId?: string) {
    return this.branchesService.findAll(franchiseId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get branch details by ID' })
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }
}
