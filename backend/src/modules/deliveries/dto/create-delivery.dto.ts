import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateDeliveryDto {
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
  bookingId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  deliveryEmployeeId: string;

  @ApiProperty({ example: 'Titan Auto Main Yard, Branch 1, Mumbai' })
  @IsString()
  @IsNotEmpty()
  deliveryLocation: string;

  @ApiProperty({ example: 15.5, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  odometerReading?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  customerAcknowledgement?: boolean;

  @ApiProperty({ example: 'docs/delivery/handover_sig.pdf', required: false })
  @IsString()
  @IsOptional()
  documentsKey?: string;
}
