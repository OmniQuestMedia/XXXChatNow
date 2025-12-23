/**
 * RedRoomRewards Member DTOs
 * 
 * Data transfer objects for member operations
 */

import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { TrustLevel, MemberType } from '../constants';

export class CreateMemberDto {
  @IsString()
  memberId: string;

  @IsEnum(MemberType)
  memberType: string;

  @IsOptional()
  @IsString()
  hashedEmail?: string;

  @IsOptional()
  @IsString()
  hashedPhone?: string;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;
}

export class LinkClientProfileDto {
  @IsString()
  memberId: string;

  @IsString()
  clientId: string;

  @IsString()
  clientProfileId: string;
}

export class UpdateTrustLevelDto {
  @IsString()
  memberId: string;

  @IsEnum(TrustLevel)
  trustLevel: string;

  @IsString()
  adminActorId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class MemberBalanceDto {
  memberId: string;
  balance: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  trustLevel: string;
  status: string;
}
