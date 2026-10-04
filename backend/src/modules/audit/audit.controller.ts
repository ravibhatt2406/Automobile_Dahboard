import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER')
  @ApiOperation({ summary: 'Get system audit trail logs (Super Admin / Franchise Owner)' })
  async getAuditLogs(@Query('limit') limit = 50, @Query('offset') offset = 0, @Query('entityType') entityType?: string) {
    const logs = await this.auditService.findAll(entityType, Number(limit), Number(offset));
    return { logs };
  }
}
