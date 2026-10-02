import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'FR-DEV-01' })
  @IsString()
  @IsNotEmpty()
  franchiseId: string;

  @ApiProperty({ example: 'BR-DET-01' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Detroit Flagship Hub' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '100 Woodward Ave', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Detroit', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'MI', required: false })
  @IsString()
  @IsOptional()
  state?: string;
}
