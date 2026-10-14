import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { CsvDataService } from './csv-data.service';
import { PreviewCsvDto, ExecuteImportDto } from './dto/import-csv.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('CSV Data Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('csv-data')
export class CsvDataController {
  constructor(private readonly csvDataService: CsvDataService) {}

  @Get('templates/:entity')
  @ApiOperation({ summary: 'Download standardized CSV template for customers, branches, franchises, employees' })
  @ApiParam({ name: 'entity', enum: ['customers', 'branches', 'franchises', 'employees'] })
  async downloadTemplate(@Param('entity') entity: string, @Res() res: Response) {
    const { filename, content } = this.csvDataService.getTemplate(entity);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(HttpStatus.OK).send(content);
  }

  @Get('export/:entity')
  @ApiOperation({ summary: 'Export real database records to CSV respecting user scope and formula sanitization' })
  @ApiParam({ name: 'entity', enum: ['customers', 'branches', 'franchises', 'employees'] })
  async exportData(
    @Param('entity') entity: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { filename, content } = await this.csvDataService.exportData(entity, user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(HttpStatus.OK).send(content);
  }

  @Post('preview/:entity')
  @ApiOperation({ summary: 'Preview CSV rows, validate fields, check foreign keys and detect duplicates' })
  @ApiParam({ name: 'entity', enum: ['customers', 'branches', 'franchises', 'employees'] })
  async previewImport(
    @Param('entity') entity: string,
    @Body() dto: PreviewCsvDto,
    @CurrentUser() user: any,
  ) {
    return this.csvDataService.previewImport(entity, dto.csvContent, user);
  }

  @Post('import/:entity')
  @ApiOperation({ summary: 'Commit validated CSV rows within transaction with duplicate skipping and audit logging' })
  @ApiParam({ name: 'entity', enum: ['customers', 'branches', 'franchises', 'employees'] })
  async executeImport(
    @Param('entity') entity: string,
    @Body() dto: ExecuteImportDto,
    @CurrentUser() user: any,
  ) {
    return this.csvDataService.executeImport(
      entity,
      dto.csvContent,
      dto.skipDuplicates ?? true,
      user,
    );
  }
}
