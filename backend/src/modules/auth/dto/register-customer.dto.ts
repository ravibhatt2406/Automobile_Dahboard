import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  Equals,
  Matches,
} from 'class-validator';

export class RegisterCustomerDto {
  @ApiProperty({ example: 'Arjun Mehta', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({ example: 'arjun.mehta@example.com', description: 'Unique customer email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({ example: '+919876543210', description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/, {
    message: 'Please provide a valid phone number (e.g. +91 98765 43210 or 9876543210)',
  })
  phone: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Account password (minimum 8 characters)' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Password cannot exceed 64 characters' })
  password: string;

  @ApiProperty({ example: true, description: 'Acceptance of Terms of Service and Privacy Policy' })
  @IsBoolean({ message: 'termsAccepted must be a boolean' })
  @Equals(true, { message: 'You must accept the Terms of Service and Privacy Policy to register' })
  termsAccepted: boolean;
}
