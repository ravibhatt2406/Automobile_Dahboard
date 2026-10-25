import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CustomerType } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Apex Logistics Inc.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+1 (800) 555-0199' })
  @IsString()
  @IsNotEmpty()
  phone: string;

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

  @ApiProperty({ enum: CustomerType, example: CustomerType.BUSINESS })
  @IsEnum(CustomerType)
  customerType: CustomerType;

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

  @ApiProperty({ example: '3d4b6650-6cd7-48ba-b7d3-3c5d8c6c86d5', required: false })
  @IsString()
  @IsOptional()
  customerId?: string | null;
}
