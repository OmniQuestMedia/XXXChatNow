/**
 * Slot Machine Configuration DTO
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md
 */

import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class SlotMachineConfigDto {
  _id: ObjectId;

  configName: string;

  version: number;

  isActive: boolean;

  spinCost: number;

  symbols: Array<{
    id: string;
    rarity: number;
    payout_3x: number;
  }>;

  returnToPlayer: number;

  maxSpinsPerHour: number;

  effectiveDate: Date;

  createdBy: string;

  notes: string;

  createdAt: Date;

  updatedAt: Date;

  constructor(data: any) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'configName',
        'version',
        'isActive',
        'spinCost',
        'symbols',
        'returnToPlayer',
        'maxSpinsPerHour',
        'effectiveDate',
        'createdBy',
        'notes',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}

export class SlotMachinePublicConfigDto {
  symbols: Array<{
    id: string;
    rarity: number;
    payout_3x: number;
  }>;

  spinCost: number;

  returnToPlayer: number;

  maxSpinsPerHour: number;

  constructor(config: any) {
    this.symbols = config.symbols;
    this.spinCost = config.spinCost;
    this.returnToPlayer = config.returnToPlayer;
    this.maxSpinsPerHour = config.maxSpinsPerHour;
  }
}
