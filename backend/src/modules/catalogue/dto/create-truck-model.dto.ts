import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTruckModelDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  manufacturerId: string;

  @ApiProperty({ example: 'Prima' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Heavy Commercial Vehicle (HCV)', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}
