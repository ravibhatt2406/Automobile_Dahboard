import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { LeadPriority } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

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
