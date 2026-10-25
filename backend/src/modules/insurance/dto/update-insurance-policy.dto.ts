import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InsuranceStatus } from '@prisma/client';

export class UpdateInsurancePolicyDto {
  @ApiProperty({ example: 'ICICI Lombard', required: false })
  @IsString()
  @IsOptional()
  insurer?: string;

  @ApiProperty({ example: 'COMPREHENSIVE', required: false })
  @IsString()
  @IsOptional()
  policyType?: string;

  @ApiProperty({ example: 45000, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  premium?: number;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2027-09-30T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({ example: 'docs/insurance/pol_123.pdf', required: false })
  @IsString()
  @IsOptional()
  documentKey?: string;

  @ApiProperty({ example: 'Zero Depreciation, Engine Protect', required: false })
  @IsString()
  @IsOptional()
  coverageDetails?: string;

  @ApiProperty({ example: 'Updated endorsement notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: InsuranceStatus, required: false })
  @IsEnum(InsuranceStatus)
  @IsOptional()
  status?: InsuranceStatus;
}
