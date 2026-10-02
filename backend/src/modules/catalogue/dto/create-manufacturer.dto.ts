import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateManufacturerDto {
  @ApiProperty({ example: 'Tata Motors' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'India', required: false })
  @IsString()
  @IsOptional()
  country?: string;
}
