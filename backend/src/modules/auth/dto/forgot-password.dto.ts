import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'customer@titanauto.com', required: false })
  @IsString()
  @IsOptional()
  emailOrPhone?: string;

  @ApiProperty({ example: 'customer@titanauto.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;
}
