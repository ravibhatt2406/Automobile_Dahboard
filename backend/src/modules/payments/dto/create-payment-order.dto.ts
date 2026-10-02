import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePaymentOrderDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'BANK_TRANSFER', required: false })
  @IsString()
  @IsOptional()
  gateway?: string;

  @ApiProperty({ example: 'IDEM-994021-X88', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
