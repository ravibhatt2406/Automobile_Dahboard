import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateQuotationDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsUUID()
  @IsOptional()
  leadId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  franchiseId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  salespersonEmployeeId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

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

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  validityDate: string;

  @ApiProperty({ example: 'Standard fleet quotation with 2 years extended warranty', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
