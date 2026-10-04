import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'MAT628001N1234567' })
  @IsString()
  @IsNotEmpty()
  vin: string;

  @ApiProperty({ example: 'ENG-99887766' })
  @IsString()
  @IsNotEmpty()
  engineNumber: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  @IsNotEmpty()
  manufacturingYear: number;

  @ApiProperty({ example: 'Arctic White', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 3800000 })
  @IsNumber()
  @IsNotEmpty()
  baseCost: number;

  @ApiProperty({ example: 4200000 })
  @IsNumber()
  @IsNotEmpty()
  sellingPrice: number;

  @ApiProperty({ example: ['https://cdn.titanauto.com/vehicles/vin-1.jpg'], required: false })
  @IsArray()
  @IsOptional()
  images?: string[];
}
