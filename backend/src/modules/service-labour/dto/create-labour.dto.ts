import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateLabourDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  serviceJobId: string;

  @ApiProperty({ example: 'ENGINE_OVERHAUL' })
  @IsString()
  @IsNotEmpty()
  labourType: string;

  @ApiProperty({ example: 'Engine Head Gasket Replacement & Torque Calibration' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @Min(0.5)
  hours: number;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @ApiProperty({ example: 200, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({ example: 18, required: false })
  @IsNumber()
  @IsOptional()
  taxRate?: number;
}
