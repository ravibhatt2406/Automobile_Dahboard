import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get list of system roles and permissions' })
  async getRoles() {
    return this.rolesService.findAll();
  }

  @Get(':name')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get details of a specific role by name' })
  async getRoleByName(@Param('name') name: string) {
    return this.rolesService.findByName(name);
  }
}
