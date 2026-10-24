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

  @ApiProperty({ example: 'Ashok Leyland', required: false })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'franchise@titanauto.com', required: false })
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ example: '+1 800-555-0199', required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ example: 'Transport Nagar, Agra Road', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Anand Agrawal', required: false })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiProperty({ example: 'active', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
