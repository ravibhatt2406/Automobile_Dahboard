import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AnnouncementCategory, AnnouncementPriority, AnnouncementStatus } from '@prisma/client';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new announcement (Admin or Manager)' })
  async create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: any) {
    return this.announcementsService.createAnnouncement(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get announcements visible to the current authenticated user' })
  async findAll(
    @CurrentUser() user: any,
    @Query('category') category?: AnnouncementCategory,
    @Query('priority') priority?: AnnouncementPriority,
    @Query('readStatus') readStatus?: 'ALL' | 'UNREAD' | 'READ',
    @Query('status') status?: AnnouncementStatus,
    @Query('search') search?: string,
  ) {
    return this.announcementsService.findAllAnnouncements(user, {
      category,
      priority,
      readStatus,
      status,
      search,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread announcement count for current user' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.announcementsService.getUnreadCount(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement details by ID and automatically mark as read' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.announcementsService.findOneAnnouncement(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing announcement' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() user: any,
  ) {
    return this.announcementsService.updateAnnouncement(id, dto, user);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Explicitly mark an announcement as read for the user' })
  async markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.announcementsService.markAsRead(id, user.id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish an announcement' })
  async publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.announcementsService.publishAnnouncement(id, user);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish / return announcement to draft' })
  async unpublish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.announcementsService.unpublishAnnouncement(id, user);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive an announcement' })
  async archive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.announcementsService.archiveAnnouncement(id, user);
  }
}
