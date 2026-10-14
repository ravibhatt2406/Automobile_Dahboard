import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'Branch ID the customer wants to chat with' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({ description: 'Optional customer ID (only usable by authorized dealership employees)' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Topic or subject of conversation', example: 'Inquiry regarding 28T tipper quotation' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ description: 'Context type', enum: ['GENERAL', 'QUOTATION', 'BOOKING', 'SERVICE_APPOINTMENT'], default: 'GENERAL' })
  @IsString()
  @IsOptional()
  contextType?: string;

  @ApiPropertyOptional({ description: 'Referenced entity ID (quotation ID, booking ID, or appointment ID)', default: 'NONE' })
  @IsString()
  @IsOptional()
  contextId?: string;

  @ApiPropertyOptional({ description: 'Initial message to start conversation' })
  @IsString()
  @IsOptional()
  initialMessage?: string;
}
