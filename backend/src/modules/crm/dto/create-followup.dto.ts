import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateFollowUpDto {
  @ApiProperty({ example: '2026-10-05T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiProperty({ example: 'Discuss customized price quotation and finance options' })
  @IsString()
  @IsNotEmpty()
  notes: string;
}
