import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Global Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantScopeGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('global')
  @ApiOperation({ summary: 'Global Search across authorized customers, vehicles, bookings, quotations, invoices, service jobs' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term (min 2 chars)' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  globalSearch(
    @Query('q') query: string,
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
    @Query('franchiseId') franchiseId?: string,
  ) {
    return this.searchService.globalSearch(query, user, branchId, franchiseId);
  }
}
