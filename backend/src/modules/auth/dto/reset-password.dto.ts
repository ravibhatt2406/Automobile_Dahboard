import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'eyJhbGciOi...', required: false })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsString()
  @IsOptional()
  otp?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'customer@titanauto.com', required: false })
  @IsString()
  @IsOptional()
  emailOrPhone?: string;

  @ApiProperty({ example: 'customer@titanauto.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'NewStrongPassword123!', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: 'NewStrongPassword123!', required: false })
  @IsString()
  @IsOptional()
  newPassword?: string;
}
