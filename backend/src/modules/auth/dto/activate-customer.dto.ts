import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ActivateCustomerDto {
  @ApiProperty({ example: 'eyJhbGciOi...', required: false })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsString()
  @IsOptional()
  otp?: string;

  @ApiProperty({ example: 'customer@titanauto.com', required: false })
  @IsString()
  @IsOptional()
  emailOrPhone?: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
