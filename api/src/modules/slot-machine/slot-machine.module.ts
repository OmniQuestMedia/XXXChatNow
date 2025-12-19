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
  SlotMachineConfigSchema
} from './schemas';
import {
  SlotMachineService,
  SlotMachineRNGService,
  SlotMachineConfigService,
  SlotMachineRateLimitService
} from './services';
import {
  SlotMachineController,
  AdminSlotMachineController
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
    SlotMachineListener
  ],
  controllers: [
    SlotMachineController,
    AdminSlotMachineController
  ],
  exports: [
    SlotMachineService,
    SlotMachineConfigService,
    SlotMachineRateLimitService
  ]
})
export class SlotMachineModule {}
