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
import { FilesService } from './files.service';
import { CreateFileAttachmentDto } from './dto/create-file-attachment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register uploaded document metadata' })
  register(@Body() dto: CreateFileAttachmentDto, @CurrentUser('id') uploadedByUserId: string) {
    return this.filesService.registerFile(dto, uploadedByUserId);
  }

  @Get('entity')
  @ApiOperation({ summary: 'List file attachments by entity' })
  @ApiQuery({ name: 'entityType' })
  @ApiQuery({ name: 'entityId' })
  findByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.filesService.findByEntity(entityType, entityId);
  }

  @Get(':fileId/download-url')
  @ApiOperation({ summary: 'Get secure download URL for file' })
  getDownloadUrl(@Param('fileId') fileId: string) {
    return this.filesService.getDownloadUrl(fileId);
  }
}
