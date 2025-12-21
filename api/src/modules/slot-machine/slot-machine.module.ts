/**
 * Slot Machine Module
 * 
 * Main module for slot machine feature.
 * Scaffolded for XXXChatNow platform only (no third-party abstraction).
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - CONTRIBUTING.md
 * - COPILOT_GOVERNANCE.md
 */

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueModule, AgendaModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { DBLoggerModule } from '../logger/db-logger.module';
import {
  SlotMachineTransaction,
  SlotMachineTransactionSchema,
  SlotMachineConfig,
  SlotMachineConfigSchema,
  SMQueueEntry,
  SMQueueEntrySchema,
  SMGameSession,
  SMGameSessionSchema,
  SMPayoutTransaction,
  SMPayoutTransactionSchema
} from './schemas';
import {
  SlotMachineService,
  SlotMachineRNGService,
  SlotMachineConfigService,
  SlotMachineRateLimitService,
  SMQueueService,
  SMPayoutService,
  SMledgerClientService,
  SMAuditService
} from './services';
import {
  SlotMachineController,
  AdminSlotMachineController,
  SMQueueController
} from './controllers';
import { SlotMachineListener } from './listeners';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SlotMachineTransaction.name,
        schema: SlotMachineTransactionSchema
      },
      {
        name: SlotMachineConfig.name,
        schema: SlotMachineConfigSchema
      },
      {
        name: SMQueueEntry.name,
        schema: SMQueueEntrySchema
      },
      {
        name: SMGameSession.name,
        schema: SMGameSessionSchema
      },
      {
        name: SMPayoutTransaction.name,
        schema: SMPayoutTransactionSchema
      }
    ]),
    QueueModule.forRoot(),
    AgendaModule.register(),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => DBLoggerModule)
  ],
  providers: [
    SlotMachineService,
    SlotMachineRNGService,
    SlotMachineConfigService,
    SlotMachineRateLimitService,
    SMQueueService,
    SMPayoutService,
    SMledgerClientService,
    SMAuditService,
    SlotMachineListener
  ],
  controllers: [
    SlotMachineController,
    AdminSlotMachineController,
    SMQueueController
  ],
  exports: [
    SlotMachineService,
    SlotMachineConfigService,
    SlotMachineRateLimitService,
    SMQueueService,
    SMPayoutService,
    SMledgerClientService,
    SMAuditService
  ]
})
export class SlotMachineModule {}
