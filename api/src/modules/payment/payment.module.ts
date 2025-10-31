import {
  Module,
  forwardRef,
  MiddlewareConsumer,
  NestModule,
  RequestMethod
} from '@nestjs/common';
import { RequestLoggerMiddleware } from 'src/modules/logger/request-log.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { SettingModule } from '../settings/setting.module';
import {
  CCBillService,
  PaymentService,
  PaymentSearchService,
  OrderService
} from './services';
import { PaymentController, PaymentSearchController, PaymentWebhookController } from './controllers';
import { TokenPackageModule } from '../token-package/token-package.module';
import { UpdateOrderStatusPaymentTransactionSuccessListener } from './listeners/update-order-status-transaction-success.listener';
import { UpdateUserBalanceFromOrderSuccessListener } from './listeners/update-user-balance-from-order-success.listener';
import { CreateOrderFromPurchasedItemListener } from './listeners/create-order-from-purchased-item.listener';
import { OrderController } from './controllers/order.controller';
import { OrderSearchService } from './services/order-search.service';
import { NotifyOrderUpdateListener } from './listeners/notify-order-update.listener';
import {
  Order, OrderSchema, PaymentTransaction, PaymentTransactionSchema
} from './schemas';
import { PurchasedItemModule } from '../purchased-item/purchased-item.module';
import { FeaturedCreatorModule } from '../featured-creator/featured-creator.module';
import {
  FeaturedCreatorBooking, FeaturedCreatorBookingSchema, FeaturedCreatorPackage, FeaturedCreatorPackageSchema
} from '../featured-creator/schemas';
import { FeaturedCreatorPackageService } from '../featured-creator/services';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema
      },
      {
        name: PaymentTransaction.name,
        schema: PaymentTransactionSchema
      },
      {
        name: FeaturedCreatorPackage.name,
        schema: FeaturedCreatorPackageSchema
      },
      {
        name: FeaturedCreatorBooking.name,
        schema: FeaturedCreatorBookingSchema
      }

    ]),
    // inject user module because we request guard from auth, need to check and fix dependencies if not needed later
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => SettingModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => TokenPackageModule),
    forwardRef(() => TokenPackageModule),
    forwardRef(() => PurchasedItemModule),
    forwardRef(() => FeaturedCreatorModule)
  ],
  providers: [
    OrderService,
    OrderSearchService,
    PaymentService,
    CCBillService,
    PaymentSearchService,
    UpdateOrderStatusPaymentTransactionSuccessListener,
    UpdateUserBalanceFromOrderSuccessListener,
    CreateOrderFromPurchasedItemListener,
    NotifyOrderUpdateListener,
    FeaturedCreatorPackageService
  ],
  controllers: [
    PaymentController,
    PaymentWebhookController,
    PaymentSearchController,
    OrderController
  ],
  exports: [PaymentService, PaymentSearchService, OrderService, FeaturedCreatorPackageService]
})
export class PaymentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes({ path: '/payment/*/callhook', method: RequestMethod.ALL });
  }
}
