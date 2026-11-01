import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResendActivationDto {
  @ApiProperty({ example: 'customer@titanauto.com' })
  @IsString()
  @IsNotEmpty()
  emailOrPhone: string;
}
