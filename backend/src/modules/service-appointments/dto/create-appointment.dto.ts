import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsUUID()
  @IsOptional()
  serviceAdvisorId?: string;

  @ApiProperty({ example: 'Periodic Scheduled Maintenance & Brake Check' })
  @IsString()
  @IsNotEmpty()
  requestedService: string;

  @ApiProperty({ example: '2026-10-15T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  preferredDate: string;

  @ApiProperty({ example: '10:00 AM', required: false })
  @IsString()
  @IsOptional()
  preferredTime?: string;

  @ApiProperty({ example: 'Engine noise during high speed haulage', required: false })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}
