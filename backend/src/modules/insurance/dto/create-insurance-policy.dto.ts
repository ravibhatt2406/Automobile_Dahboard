import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InsuranceStatus } from '@prisma/client';

export class CreateInsurancePolicyDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  bookingId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiProperty({ example: 'ICICI Lombard' })
  @IsString()
  @IsNotEmpty()
  insurer: string;

  @ApiProperty({ example: 'COMPREHENSIVE' })
  @IsString()
  @IsNotEmpty()
  policyType: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  @Min(1)
  premium: number;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2027-09-30T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @ApiProperty({ example: 'docs/insurance/pol_123.pdf', required: false })
  @IsString()
  @IsOptional()
  documentKey?: string;

  @ApiProperty({ example: 'POL-12345', required: false })
  @IsString()
  @IsOptional()
  policyNumber?: string;

  @ApiProperty({ example: 'Zero Depreciation, Engine Protect', required: false })
  @IsString()
  @IsOptional()
  coverageDetails?: string;

  @ApiProperty({ example: 'Verified with commercial insurer ledger', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: InsuranceStatus, required: false, default: InsuranceStatus.ACTIVE })
  @IsEnum(InsuranceStatus)
  @IsOptional()
  status?: InsuranceStatus;
}
