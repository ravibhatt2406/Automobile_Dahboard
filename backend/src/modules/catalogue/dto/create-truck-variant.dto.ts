import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTruckVariantDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @ApiProperty({ example: 'Prima 5530.S Trailer' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Cummins ISBe 6.7L BS6', required: false })
  @IsString()
  @IsOptional()
  engineDetails?: string;

  @ApiProperty({ example: 300, required: false })
  @IsNumber()
  @IsOptional()
  horsepower?: number;

  @ApiProperty({ example: 'Diesel', required: false })
  @IsString()
  @IsOptional()
  fuelType?: string;

  @ApiProperty({ example: '9-Speed Manual', required: false })
  @IsString()
  @IsOptional()
  transmission?: string;

  @ApiProperty({ example: 55, required: false })
  @IsNumber()
  @IsOptional()
  payload?: number;

  @ApiProperty({ example: 4200000 })
  @IsNumber()
  @IsNotEmpty()
  basePrice: number;

  @ApiProperty({ example: 28.00, required: false })
  @IsNumber()
  @IsOptional()
  gstRate?: number;

  @ApiProperty({ example: 'Heavy duty long haul tractor trailer', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['https://cdn.titanauto.com/trucks/prima-5530-1.png'], required: false })
  @IsArray()
  @IsOptional()
  images?: string[];
}
