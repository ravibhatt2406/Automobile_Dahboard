import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ComplianceDocType, ComplianceDocStatus } from '@prisma/client';

export class CreateComplianceDocDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ enum: ComplianceDocType, example: 'PUC' })
  @IsEnum(ComplianceDocType)
  @IsNotEmpty()
  documentType: ComplianceDocType;

  @ApiProperty({ example: 'PUC-DL-2026-98124' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ example: 'Delhi Transport Department / RTO', required: false })
  @IsString()
  @IsOptional()
  issuingAuthority?: string;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  issueDate?: string;

  @ApiProperty({ example: '2027-01-14T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({ example: '/uploads/compliance/puc_doc.pdf', required: false })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @ApiProperty({ example: '/uploads/compliance/puc_doc.pdf', required: false })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiProperty({ example: 'Annual pollution compliance check passed', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: ComplianceDocStatus, example: 'VALID', required: false })
  @IsEnum(ComplianceDocStatus)
  @IsOptional()
  status?: ComplianceDocStatus;
}
