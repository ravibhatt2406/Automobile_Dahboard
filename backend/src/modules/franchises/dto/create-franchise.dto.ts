import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFranchiseDto {
  @ApiProperty({ example: 'FR-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Titan Commercial North America' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Titan Commercial Motors Corp.', required: false })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiProperty({ example: 'US-TX994021', required: false })
  @IsString()
  @IsOptional()
  taxId?: string;
}
