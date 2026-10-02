import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateFinanceApplicationDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ example: 'HDFC Bank' })
  @IsString()
  @IsNotEmpty()
  financeProvider: string;

  @ApiProperty({ example: 4000000 })
  @IsNumber()
  @Min(1)
  loanAmount: number;

  @ApiProperty({ example: 1000000 })
  @IsNumber()
  @Min(0)
  downPayment: number;

  @ApiProperty({ example: 60 })
  @IsNumber()
  @Min(1)
  tenureMonths: number;

  @ApiProperty({ example: 9.5, required: false })
  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @ApiProperty({ example: 'Subject to document verification', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
