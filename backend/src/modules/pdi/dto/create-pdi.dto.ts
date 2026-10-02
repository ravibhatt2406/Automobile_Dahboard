import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { PdiStatus } from '@prisma/client';

export class CreatePdiDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @ApiProperty({
    example: {
      exterior: 'OK',
      tyres: 'OK',
      engine: 'OK',
      brakes: 'OK',
      lights: 'OK',
      electrical: 'OK',
      documents: 'OK',
      accessories: 'OK',
      safetyEquipment: 'OK',
      generalCondition: 'EXCELLENT',
    },
  })
  @IsObject()
  @IsNotEmpty()
  checklist: Record<string, any>;

  @ApiProperty({ example: 'PASSED', enum: PdiStatus, required: false })
  @IsEnum(PdiStatus)
  @IsOptional()
  status?: PdiStatus;

  @ApiProperty({ example: [], required: false })
  @IsArray()
  @IsOptional()
  failedItems?: string[];

  @ApiProperty({ example: 'All 50 checklist items verified and passed', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({ example: [], required: false })
  @IsArray()
  @IsOptional()
  images?: string[];
}
