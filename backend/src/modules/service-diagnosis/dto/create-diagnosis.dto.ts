import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateDiagnosisDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  serviceJobId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  mechanicId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: 'Blown head gasket and worn clutch pressure plate detected during teardown' })
  @IsString()
  @IsNotEmpty()
  findings: string;

  @ApiProperty({ example: 'Replace Cylinder Head Gasket, Machining, Clutch Disc & Pressure Plate Overhaul' })
  @IsString()
  @IsNotEmpty()
  recommendedWork: string;

  @ApiProperty({ example: 'HIGH', required: false })
  @IsString()
  @IsOptional()
  severity?: string;

  @ApiProperty({ example: 15000, required: false, description: 'Triggers WAITING_FOR_APPROVAL if additional cost > 0' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  additionalCost?: number;

  @ApiProperty({ example: [], required: false })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 'Immediate customer approval required before engine assembly', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
