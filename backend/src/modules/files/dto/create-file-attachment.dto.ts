import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateFileAttachmentDto {
  @ApiProperty({ example: 'Vehicle' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ example: 'rc_book.pdf' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ example: 1048576 })
  @IsNumber()
  @Min(1)
  size: number;

  @ApiProperty({ example: 'documents/vehicles/rc_book_123.pdf' })
  @IsString()
  @IsNotEmpty()
  storageKey: string;
}
