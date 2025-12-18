import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PolicyModule } from './modules/policy/policy.module';
import { TokenBundlesModule } from './modules/token-bundles/token-bundles.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ModelDashboardModule } from './modules/model-dashboard/model-dashboard.module';
import { EmailsModule } from './modules/emails/emails.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'redroomrewards',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    ScheduleModule.forRoot(),
    PolicyModule,
    TokenBundlesModule,
    WalletModule,
    CampaignsModule,
    ModelDashboardModule,
    EmailsModule,
    AuditModule,
  ],
})
export class AppModule {}
