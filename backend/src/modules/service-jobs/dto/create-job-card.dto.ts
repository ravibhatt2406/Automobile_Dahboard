import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateJobCardDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  serviceAdvisorId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  assignedMechanicId?: string;

  @ApiProperty({ example: 'Heavy engine vibration under full payload. Transmission slipping.' })
  @IsString()
  @IsNotEmpty()
  complaint: string;

  @ApiProperty({ example: 45000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  odometer?: number;

  @ApiProperty({ example: '75%', required: false })
  @IsString()
  @IsOptional()
  fuelLevel?: string;

  @ApiProperty({ example: '2026-10-16T18:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  estimatedCompletionTime?: string;

  @ApiProperty({ example: 25000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  warrantyCoverage?: boolean;

  @ApiProperty({ example: 'CLM-WARR-994', required: false })
  @IsString()
  @IsOptional()
  warrantyClaimRef?: string;

  @ApiProperty({ example: 'Priority repair for corporate fleet vehicle', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
