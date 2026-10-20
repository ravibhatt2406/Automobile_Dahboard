import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReminderCategory } from '@prisma/client';

export class CreateReminderDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ enum: ReminderCategory, example: ReminderCategory.SERVICE_DUE })
  @IsEnum(ReminderCategory)
  @IsNotEmpty()
  category: ReminderCategory;

  @ApiProperty({ example: 'Rajesh Sharma' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({ example: 'SERVICE_JOB', required: false })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiProperty({ example: 'job-uuid-1234', required: false })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ example: '2026-11-02T10:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ example: 'STANDARD_SERVICE_REMINDER', required: false })
  @IsString()
  @IsOptional()
  messageTemplate?: string;

  @ApiProperty({ example: 'Dear Rajesh Sharma, your Titan Auto commercial vehicle MH-12-AB-1234 is due for periodic maintenance service on 02 Nov 2026. Please contact Titan Auto Pune Workshop at 020-27471000 to reserve your bay.' })
  @IsString()
  @IsNotEmpty()
  draftMessage: string;

  @ApiProperty({ example: 'Customer prefers morning service slots', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
