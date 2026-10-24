import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePartDto {
  @ApiProperty({ example: 'PRT-FLTR-881' })
  @IsString()
  @IsNotEmpty()
  partNumber: string;

  @ApiProperty({ example: 'Heavy Duty Oil Filter Element' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Tata OEM High Efficiency Synthetic Media Oil Filter', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Tata Motors Genuine Parts', required: false })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({ example: 'FILTERS', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 1850 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 18, required: false })
  @IsNumber()
  @IsOptional()
  gstRate?: number;

  @ApiProperty({ example: '8f146f47-f6d8-4909-8b85-996f444f701b', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: '8f146f47-f6d8-4909-8b85-996f444f701b', required: false })
  @IsString()
  @IsOptional()
  franchiseId?: string;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  quantityOnHand?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  stockQuantity?: number;
}
