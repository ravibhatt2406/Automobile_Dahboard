import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { LeadPriority, LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  franchiseId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsUUID()
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

  @ApiProperty({ enum: LeadPriority, example: LeadPriority.HIGH })
  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @ApiProperty({ example: 'Customer interested in fleet of 5 heavy tippers', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
