import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCampaignExpenseDto {
  @ApiProperty({ example: 'Venue Stage Setup & Audio PA System' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'LOGISTICS', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: '2026-11-01T10:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  expenseDate?: string;

  @ApiProperty({ example: 'https://cdn.titanauto.com/receipts/exp-102.pdf', required: false })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiProperty({ example: 'Paid via branch petty cash, voucher #V-409', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
