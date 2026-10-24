import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'john.smith@titanauto.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1 (800) 555-9011', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'EMP-1049' })
  @IsString()
  @IsNotEmpty()
  employeeCode: string;

  @ApiProperty({ example: 'BRANCH_MANAGER' })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({ example: 'Senior Branch Operations Manager', required: false })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiProperty({ example: '8f146f47-f6d8-4909-8b85-996f444f701b', required: false })
  @IsString()
  @IsOptional()
  franchiseId?: string;

  @ApiProperty({ example: 'Operations', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ example: 'active', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
