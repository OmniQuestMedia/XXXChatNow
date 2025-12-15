import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { PerformerModule } from 'src/modules/performer/performer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { StudioController, StudioCommissionController } from './controllers';
import { StudioService, StudioCommissionService } from './services';
import { StudioMemberListener, ModelListener } from './listeners';
import { Studio, StudioSchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Studio.name,
        schema: StudioSchema
      }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule)
  ],
  controllers: [StudioController, StudioCommissionController],
  providers: [
    StudioService,
    StudioCommissionService,
    StudioMemberListener,
    ModelListener
  ],
  exports: [StudioService]
})
export class StudioModule { }
