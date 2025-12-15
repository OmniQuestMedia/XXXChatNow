import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PerformerScheduleService } from './services';
import { PerformerScheduleController } from './controllers';
import { PerformerModule } from '../performer/performer.module';
import { PerformerSchedule, PerformerScheduleSchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PerformerSchedule.name,
        schema: PerformerScheduleSchema
      }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule)
  ],
  providers: [
    PerformerScheduleService
  ],
  controllers: [
    PerformerScheduleController
  ],
  exports: [
    PerformerScheduleService
  ]
})

export class PerformerScheduleModule {}
