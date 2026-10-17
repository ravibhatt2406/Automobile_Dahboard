import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateQuotationDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  leadId?: string;

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
  salespersonEmployeeId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 50000, required: false })
  @IsNumber()
  @IsOptional()
  accessoriesAmount?: number;

  @ApiProperty({ example: 120000, required: false })
  @IsNumber()
  @IsOptional()
  insuranceAmount?: number;

  @ApiProperty({ example: 85000, required: false })
  @IsNumber()
  @IsOptional()
  registrationAmount?: number;

  @ApiProperty({ example: 15000, required: false })
  @IsNumber()
  @IsOptional()
  financeCharges?: number;

  @ApiProperty({ example: 100000, required: false })
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  validityDate?: string;

  @ApiProperty({ example: 'Standard fleet quotation with 2 years extended warranty', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
