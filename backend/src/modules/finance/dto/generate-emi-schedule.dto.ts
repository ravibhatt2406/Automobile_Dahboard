import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class GenerateEmiScheduleDto {
  @ApiProperty({ example: '2026-12-05T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  firstDueDate: string;

  @ApiProperty({ example: 83950, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  customEmiAmount?: number;

  @ApiProperty({ example: 60, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  tenureMonths?: number;

  @ApiProperty({ example: 9.5, required: false })
  @IsNumber()
  @IsOptional()
  interestRate?: number;
}
