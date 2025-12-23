/**
 * RedRoomRewards Lock DTOs
 * 
 * Data transfer objects for lock operations
 */

import { IsString, IsEnum, IsOptional, IsDate } from 'class-validator';
import { LockType } from '../constants';

export class ImposeLockDto {
  @IsString()
  memberId: string;

  @IsEnum(LockType)
  lockType: string;

  @IsString()
  reasonCode: string;

  @IsString()
  reasonDescription: string;

  @IsString()
  imposedBy: string; // admin ID

  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class ReleaseLockDto {
  @IsString()
  lockId: string;

  @IsString()
  releasedBy: string; // admin ID

  @IsString()
  releaseReason: string;
}

export class LockResponseDto {
  lockId: string;
  memberId: string;
  lockType: string;
  isActive: boolean;
  imposedAt: Date;
  expiresAt?: Date;
  message?: string;
}
