import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ example: 'pay_994021_xyz' })
  @IsString()
  @IsNotEmpty()
  gatewayPaymentId: string;

  @ApiProperty({ example: 'sig_1234567890abcdef' })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({ example: 'UPI', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
