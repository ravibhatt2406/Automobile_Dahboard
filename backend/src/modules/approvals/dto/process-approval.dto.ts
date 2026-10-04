import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ProcessApprovalAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ProcessApprovalDto {
  @ApiProperty({ enum: ProcessApprovalAction, example: ProcessApprovalAction.APPROVE, required: false })
  @IsEnum(ProcessApprovalAction)
  @IsOptional()
  action?: ProcessApprovalAction;

  @ApiProperty({ example: 'APPROVED', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Documentation verified and onboarding approved', required: false })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiProperty({ example: 'Documentation verified and onboarding approved', required: false })
  @IsString()
  @IsOptional()
  comments?: string;
}

