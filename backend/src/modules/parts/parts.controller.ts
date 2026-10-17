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
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdateStockDto, IssuePartToJobDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Parts & Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller(['parts', 'spare-parts'])
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Create new spare part in catalogue' })
  createPart(@Body() dto: CreatePartDto, @CurrentUser('id') actorUserId: string) {
    return this.partsService.createPart(dto, actorUserId);
  }

  @Post('stock-movement')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER', 'PARTS_EXECUTIVE')
  @ApiOperation({ summary: 'Record stock movement (Intake, Adjustment, Return)' })
  updateStock(@Body() dto: UpdateStockDto, @CurrentUser('id') actorUserId: string, @CurrentUser() user: any) {
    return this.partsService.updateStock(dto, actorUserId, user);
  }

  @Post('issue-to-job')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'PARTS_EXECUTIVE')
  @ApiOperation({ summary: 'Issue spare part to service job card' })
  issuePartToJob(@Body() dto: IssuePartToJobDto, @CurrentUser('id') actorUserId: string, @CurrentUser() user: any) {
    return this.partsService.issuePartToJob(dto, actorUserId, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'List parts in catalogue' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAllParts(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    return this.partsService.findAllParts(category, search, branchId, limit ? +limit : 50, offset ? +offset : 0, user, franchiseId);
  }

  @Get('stock/branch/:branchId')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Get stock levels for branch' })
  findStockByBranch(@Param('branchId') branchId: string, @CurrentUser() user: any) {
    return this.partsService.findStockByBranch(branchId, user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Get single spare part details by ID' })
  findOnePart(@Param('id') id: string) {
    return this.partsService.findOnePart(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Update spare part details in catalogue' })
  updatePart(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePartDto>,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.partsService.updatePart(id, dto, actorUserId);
  }
}
