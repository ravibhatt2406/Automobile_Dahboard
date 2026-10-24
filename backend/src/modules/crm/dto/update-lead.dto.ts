import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { LeadPriority, LeadStatus } from '@prisma/client';

export class UpdateLeadDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  assignedEmployeeId?: string;

  @ApiProperty({ enum: LeadStatus, example: LeadStatus.QUALIFIED, required: false })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiProperty({ enum: LeadPriority, example: LeadPriority.HIGH, required: false })
  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  campaignId?: string;

  @ApiProperty({ example: 'DIRECT_WALKIN', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ example: 'Signa 4825.TK', required: false })
  @IsString()
  @IsOptional()
  interestedModel?: string;

  @ApiProperty({ example: 5200000, required: false })
  @IsNumber()
  @IsOptional()
  expectedBudget?: number;

  @ApiProperty({ example: 'Client requested revised quotation with 3-year AMC', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'Budget constraints - opted for used vehicle', required: false })
  @IsString()
  @IsOptional()
  lostReason?: string;

  @ApiProperty({ example: '2026-11-20T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  expectedPurchaseDate?: string;

  @ApiProperty({ example: '2026-11-10T14:30:00.000Z', required: false })
  @IsString()
  @IsOptional()
  nextFollowUpDate?: string;
}
