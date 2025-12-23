/**
 * RedRoomRewards Merge DTOs
 * 
 * Data transfer objects for account merge operations
 */

import { IsString, IsArray, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { EvidenceType } from '../constants';

export class InitiateMergeDto {
  @IsString()
  sourceMemberId: string;

  @IsString()
  targetMemberId: string;

  @IsString()
  clientId: string;

  @IsString()
  requestReason: string;

  @IsString()
  ticketReference: string;

  @IsArray()
  @IsEnum(EvidenceType, { each: true })
  evidenceTypes: string[];

  @IsString()
  evidenceSummary: string; // no raw PII

  @IsBoolean()
  userAcknowledgement: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class ApproveMergeStage1Dto {
  @IsString()
  mergeId: string;

  @IsArray()
  @IsString({ each: true })
  clientAdminIds: string[]; // must be 2 distinct admins for XCN

  @IsOptional()
  @IsString()
  auditNote?: string;
}

export class ApproveMergeStage2Dto {
  @IsString()
  mergeId: string;

  @IsString()
  rrrAdminId: string;

  @IsString()
  survivingClientProfileId: string; // which client profile to keep

  @IsOptional()
  @IsString()
  auditNote?: string;
}

export class RejectMergeDto {
  @IsString()
  mergeId: string;

  @IsString()
  rejectedBy: string;

  @IsString()
  rejectionReason: string;
}

export class MergeResponseDto {
  mergeId: string;
  status: string;
  sourceMemberId: string;
  targetMemberId: string;
  createdAt: Date;
  message?: string;
}
