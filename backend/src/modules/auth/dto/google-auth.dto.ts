import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token (credential) returned by Google Identity Services',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Google credential ID token is required' })
  credential: string;

  @ApiPropertyOptional({
    description: 'Portal boundary through which the user is authenticating',
    enum: ['customer', 'organization'],
    example: 'customer',
  })
  @IsOptional()
  @IsIn(['customer', 'organization'], {
    message: 'portal must be either "customer" or "organization"',
  })
  portal?: 'customer' | 'organization';
}
