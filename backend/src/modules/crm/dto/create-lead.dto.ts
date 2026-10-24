import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { LeadPriority } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'Rajesh Sharma', required: false })
  @IsString()
  @IsOptional()
  prospectName?: string;

  @ApiProperty({ example: '+91 98765 43210', required: false })
  @IsString()
  @IsOptional()
  prospectPhone?: string;

  @ApiProperty({ example: 'rajesh@sharmatransport.in', required: false })
  @IsString()
  @IsOptional()
  prospectEmail?: string;

  @ApiProperty({ example: 'Sharma Transport Fleet', required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ example: '2026-11-20T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  expectedPurchaseDate?: string;

  @ApiProperty({ example: '2026-11-05T10:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  nextFollowUpDate?: string;

  @ApiProperty({ example: 'Competitor offered lower rate', required: false })
  @IsString()
  @IsOptional()
  lostReason?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  franchiseId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  assignedEmployeeId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  campaignId?: string;

  @ApiProperty({ example: 'WEBSITE_INQUIRY', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ example: 'Prima 5530.S', required: false })
  @IsString()
  @IsOptional()
  interestedModel?: string;

  @ApiProperty({ example: 4500000, required: false })
  @IsNumber()
  @IsOptional()
  expectedBudget?: number;

  @ApiProperty({ enum: LeadPriority, example: LeadPriority.HIGH, required: false })
  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @ApiProperty({ example: 'Customer interested in fleet of 5 heavy tippers', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
