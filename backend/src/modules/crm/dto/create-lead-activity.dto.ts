import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LeadActivityType } from '@prisma/client';

export class CreateLeadActivityDto {
  @ApiProperty({ enum: LeadActivityType, example: LeadActivityType.CALL })
  @IsEnum(LeadActivityType)
  @IsNotEmpty()
  activityType: LeadActivityType;

  @ApiProperty({ example: 'Discussed AVTR 5525.T pricing and body customization' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Client requested revised quote with AMC and 48-month EMI options', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-11-10T14:30:00.000Z', required: false })
  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @ApiProperty({ example: '2026-11-10T15:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  completedAt?: string;
}
