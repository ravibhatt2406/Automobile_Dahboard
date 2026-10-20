import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordEmiPaymentDto {
  @ApiProperty({ example: 83950 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'NACH_ECS', description: 'NACH_ECS, NEFT, RTGS, CHEQUE, UPI, DIRECT_DEBIT' })
  @IsString()
  @IsNotEmpty()
  paymentMode: string;

  @ApiProperty({ example: 'HDFC-TXN-9847123984' })
  @IsString()
  @IsNotEmpty()
  paymentReference: string;

  @ApiProperty({ example: '2026-12-05T11:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @ApiProperty({ example: 'https://cdn.titanauto.com/finance/receipts/emi-01.pdf', required: false })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiProperty({ example: 'Cleared via monthly auto-debit NACH mandate', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
