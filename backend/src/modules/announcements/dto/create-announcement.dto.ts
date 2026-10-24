import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementAudience,
} from '@prisma/client';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Q4 National Commercial Fleet Sales Incentive Program' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'All branches are eligible for additional bonuses on AVTR 5525.T and Prima deliveries.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: AnnouncementCategory, example: AnnouncementCategory.SALES, required: false })
  @IsEnum(AnnouncementCategory)
  @IsOptional()
  category?: AnnouncementCategory;

  @ApiProperty({ enum: AnnouncementPriority, example: AnnouncementPriority.NORMAL, required: false })
  @IsEnum(AnnouncementPriority)
  @IsOptional()
  priority?: AnnouncementPriority;

  @ApiProperty({ enum: AnnouncementStatus, example: AnnouncementStatus.PUBLISHED, required: false })
  @IsEnum(AnnouncementStatus)
  @IsOptional()
  status?: AnnouncementStatus;

  @ApiProperty({ enum: AnnouncementAudience, example: AnnouncementAudience.PLATFORM_WIDE, required: false })
  @IsEnum(AnnouncementAudience)
  @IsOptional()
  targetAudience?: AnnouncementAudience;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  franchiseId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: ['branch-id-1', 'branch-id-2'], required: false })
  @IsArray()
  @IsOptional()
  targetBranchIds?: string[];

  @ApiProperty({ example: '2026-10-20T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z', required: false })
  @IsString()
  @IsOptional()
  expiryDate?: string;
}
