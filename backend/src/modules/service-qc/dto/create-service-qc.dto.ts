import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { QcStatus } from '@prisma/client';

export class CreateServiceQcDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  serviceJobId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({
    example: {
      enginePerformance: 'OK',
      brakeTest: 'OK',
      transmissionShift: 'OK',
      electricalSystem: 'OK',
      fluidLevels: 'OK',
      roadTest: 'PASSED',
    },
  })
  @IsObject()
  @IsNotEmpty()
  checklist: Record<string, any>;

  @ApiProperty({ example: 'PASSED', enum: QcStatus })
  @IsEnum(QcStatus)
  status: QcStatus;

  @ApiProperty({ example: [], required: false })
  @IsArray()
  @IsOptional()
  failedItems?: string[];

  @ApiProperty({ example: 'Quality inspection verified. All systems nominal.', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({ example: [], required: false })
  @IsArray()
  @IsOptional()
  images?: string[];
}
