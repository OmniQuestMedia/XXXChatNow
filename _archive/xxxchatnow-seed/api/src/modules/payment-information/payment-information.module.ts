import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PaymentInformationService } from './services';
import { PaymentInformationController } from './controllers';
import { PerformerModule } from '../performer/performer.module';
import { StudioModule } from '../studio/studio.module';
import { PaymentInformation, PaymentInformationSchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PaymentInformation.name,
        schema: PaymentInformationSchema
      }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => StudioModule)
  ],
  providers: [PaymentInformationService],
  controllers: [PaymentInformationController],
  exports: [PaymentInformationService]
})
export class PaymentInformationModule { }
