import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CustomerType, CustomerStatus } from '@prisma/client';

export class UpdateCustomerDto {
  @ApiProperty({ example: 'Apex Logistics Inc.', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+1 (800) 555-0199', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'contact@apexlogistics.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '100 Industrial Parkway', required: false })
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

  @ApiProperty({ example: '48201', required: false })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiProperty({ example: '29ABCDE1234F1Z5', required: false })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiProperty({ example: 'ABCDE1234F', required: false })
  @IsString()
  @IsOptional()
  pan?: string;

  @ApiProperty({ enum: CustomerType, example: CustomerType.BUSINESS, required: false })
  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @ApiProperty({ example: 'Apex Logistics LLC', required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ example: '8f146f47-f6d8-4909-8b85-996f444f701b', required: false })
  @IsString()
  @IsOptional()
  preferredBranchId?: string | null;

  @ApiProperty({ example: '8f146f47-f6d8-4909-8b85-996f444f701b', required: false })
  @IsString()
  @IsOptional()
  branchId?: string | null;

  @ApiProperty({ example: '8f146f47-f6d8-4909-8b85-996f444f701b', required: false })
  @IsString()
  @IsOptional()
  franchiseId?: string | null;

  @ApiProperty({ enum: CustomerStatus, example: CustomerStatus.ACTIVE, required: false })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;
}
