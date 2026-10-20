import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ReminderCategory, ReminderStatus } from '@prisma/client';

@ApiTags('WhatsApp Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('eligible')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Get list of actionable upcoming due items for Service, Insurance, PUC/Compliance, or EMI' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'category', required: false, enum: ReminderCategory })
  getEligible(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('category') category?: ReminderCategory,
    @CurrentUser() user?: any,
  ) {
    return this.remindersService.getEligibleReminders(branchId, franchiseId, category, user);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Save prepared reminder draft for customer' })
  create(@Body() dto: CreateReminderDto, @CurrentUser() user: any) {
    return this.remindersService.create(dto, user);
  }

  @Post(':id/initiate')
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Mark reminder as user-initiated (click-to-send WhatsApp triggered by staff)' })
  markInitiated(@Param('id') id: string, @CurrentUser() user: any) {
    return this.remindersService.markInitiated(id, user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'Get audit history of all customer reminders' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'category', required: false, enum: ReminderCategory })
  @ApiQuery({ name: 'status', required: false, enum: ReminderStatus })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('category') category?: ReminderCategory,
    @Query('status') status?: ReminderStatus,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @CurrentUser() user?: any,
  ) {
    return this.remindersService.findAll(
      branchId,
      franchiseId,
      category,
      status,
      +limit,
      +offset,
      user,
    );
  }
}
