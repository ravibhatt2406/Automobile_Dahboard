import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CampaignStatus } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Monsoon Commercial Fleet Mega Camp 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Customer outreach and check-up camp for logistics operators', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Transport Nagar Highway Hub, Branch Ground', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: '2026-11-01T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-11-05T18:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  coordinatorId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  franchiseId?: string;

  @ApiProperty({ example: 150000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @ApiProperty({ enum: CampaignStatus, example: CampaignStatus.UPCOMING, required: false })
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @ApiProperty({ example: 'Targeting Tipper and Heavy Haulage operators along NH44 corridor', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
