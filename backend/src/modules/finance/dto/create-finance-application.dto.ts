import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFinanceApplicationDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  bookingId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiProperty({ example: 'HDFC Bank Commercial Vehicle Finance' })
  @IsString()
  @IsNotEmpty()
  financeProvider: string;

  @ApiProperty({ example: 'HDFC-CV-2026-99881', required: false })
  @IsString()
  @IsOptional()
  loanReference?: string;

  @ApiProperty({ example: 4800000, required: false })
  @IsNumber()
  @IsOptional()
  vehiclePrice?: number;

  @ApiProperty({ example: 4000000 })
  @IsNumber()
  @Min(1)
  loanAmount: number;

  @ApiProperty({ example: 800000 })
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

  @ApiProperty({ example: 'REDUCING_BALANCE', required: false, enum: ['REDUCING_BALANCE', 'FLAT_RATE'] })
  @IsString()
  @IsOptional()
  interestMethod?: string;

  @ApiProperty({ example: 83950, required: false })
  @IsNumber()
  @IsOptional()
  emiAmount?: number;

  @ApiProperty({ example: '2026-12-05T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  firstEmiDate?: string;

  @ApiProperty({ example: 'docs/finance/agreement_01.pdf', required: false })
  @IsString()
  @IsOptional()
  documentKey?: string;

  @ApiProperty({ example: 'Subject to financier approval and verification', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
