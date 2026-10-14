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
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantScopeGuard } from '@/common/guards/tenant-scope.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Chat & Messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantScopeGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create or get existing conversation with a branch' })
  createOrGetConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.createOrGetConversation(dto, user);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations within user authorization scope' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'search', required: false })
  listConversations(
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.chatService.listConversations({ branchId, search }, user);
  }

  @Get('conversations/unread-count')
  @ApiOperation({ summary: 'Get total unread messages count for current user' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.chatService.getUnreadCount(user);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation details and messages, marking unread messages as read' })
  getConversation(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getConversation(id, user);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send text message in conversation' })
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.sendMessage(id, dto, user);
  }

  @Patch('conversations/:id/assign')
  @ApiOperation({ summary: 'Assign conversation to an authorized branch employee' })
  assignConversation(
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.assignConversation(id, dto.employeeId, user);
  }
}
