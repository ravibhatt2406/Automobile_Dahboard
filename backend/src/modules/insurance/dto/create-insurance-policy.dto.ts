import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInsurancePolicyDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

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
}
