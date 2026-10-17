import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'customer@rajasthanlogistics.com', description: 'Registered email or phone number', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'customer@rajasthanlogistics.com', description: 'Alias for email field', required: false })
  @IsOptional()
  @IsString()
  emailOrPhone?: string;

  @ApiProperty({ example: 'Customer123!', description: 'Account password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

