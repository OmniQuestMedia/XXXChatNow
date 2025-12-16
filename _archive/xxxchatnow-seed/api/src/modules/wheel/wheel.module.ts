import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // thêm import này
import { MongoDBModule, QueueModule, AgendaModule } from 'src/kernel';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { WheelResultListener } from './listeners/wheel-result-listenter';
import { WheelService, WheelSearchService, WheelResultService } from './services';
import { WheelController, WheelResultController } from './controllers';
import { WheelSchema, WheelResultSchema } from './schemas'; // import schema ở đây

@Module({
  imports: [
    MongoDBModule,
    MongooseModule.forFeature([
      { name: 'wheelOption', schema: WheelSchema },
      { name: 'wheelResult', schema: WheelResultSchema }
    ]),
    AgendaModule.register(),
    QueueModule.forRoot(),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PaymentModule)
  ],
  providers: [
    WheelService,
    WheelSearchService,
    WheelResultService,
    WheelResultListener
  ],
  controllers: [
    WheelController,
    WheelResultController
  ],
  exports: [WheelService, WheelSearchService, WheelResultService]
})
export class WheelModule { }
