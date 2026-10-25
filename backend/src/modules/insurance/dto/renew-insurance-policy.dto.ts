import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RenewInsurancePolicyDto {
  @ApiProperty({ example: '2027-10-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  newStartDate: string;

  @ApiProperty({ example: '2028-09-30T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  newExpiryDate: string;

  @ApiProperty({ example: 48000 })
  @IsNumber()
  @Min(1)
  newPremium: number;

  @ApiProperty({ example: 'POL-RENEW-2027-01', required: false })
  @IsString()
  @IsOptional()
  newPolicyNumber?: string;

  @ApiProperty({ example: 'ICICI Lombard', required: false })
  @IsString()
  @IsOptional()
  insurer?: string;

  @ApiProperty({ example: 'COMPREHENSIVE', required: false })
  @IsString()
  @IsOptional()
  policyType?: string;

  @ApiProperty({ example: 'docs/insurance/pol_renew_123.pdf', required: false })
  @IsString()
  @IsOptional()
  documentKey?: string;

  @ApiProperty({ example: 'Fleet annual renewal policy', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
