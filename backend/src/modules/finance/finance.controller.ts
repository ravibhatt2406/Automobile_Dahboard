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
import { FinanceService } from './finance.service';
import { CreateFinanceApplicationDto } from './dto/create-finance-application.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FinanceStatus } from '@prisma/client';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('finance/applications')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Submit finance application' })
  create(@Body() dto: CreateFinanceApplicationDto, @CurrentUser('id') actorUserId: string) {
    return this.financeService.create(dto, actorUserId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'FINANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'List finance applications' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: FinanceStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: FinanceStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    return this.financeService.findAll(customerId, status, limit ? +limit : 50, offset ? +offset : 0, user, branchId, franchiseId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'FINANCE_MANAGER', 'CUSTOMER')
  @ApiOperation({ summary: 'Get finance application details' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.financeService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Update finance application status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: FinanceStatus,
    @Body('remarks') remarks: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.financeService.updateStatus(id, status, remarks, actorUserId);
  }
}
