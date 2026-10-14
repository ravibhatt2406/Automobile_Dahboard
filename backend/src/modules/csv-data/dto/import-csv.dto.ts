import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreviewCsvDto {
  @ApiProperty({ description: 'Raw CSV file text content' })
  @IsString()
  @IsNotEmpty()
  csvContent: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  franchiseId?: string;
}

export class ExecuteImportDto {
  @ApiProperty({ description: 'Raw CSV file text content to commit' })
  @IsString()
  @IsNotEmpty()
  csvContent: string;

  @ApiPropertyOptional({ description: 'Whether to skip duplicate rows or reject', default: true })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  franchiseId?: string;
}
