import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { AuthService, VerificationService } from './services';
import { AuthGuard, RoleGuard } from './guards';
import { RegisterController } from './controllers/register.controller';
import { LoginController } from './controllers/login.controller';
import { PasswordController } from './controllers/password.controller';

// performer
import { PerformerRegisterController } from './controllers/performer-register.controller';
import { PerformerModule } from '../performer/performer.module';
import { PerformerLoginController } from './controllers/performer-login.controller';
import { StudioRegisterController } from './controllers/studio-register.controller';
import { StudioLoginController } from './controllers/studio-login.controller';
import { StudioModule } from '../studio/studio.module';
import { VerifycationController } from './controllers/verification.controller';
import { SettingModule } from '../settings/setting.module';
import {
  Auth,
  AuthSchema,
  Forgot,
  ForgotSchema,
  Verification,
  VerificationSchema
} from './schemas';
import { ReferralModule } from '../referral/referral.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Auth.name,
        schema: AuthSchema
      },
      {
        name: Forgot.name,
        schema: ForgotSchema
      },
      {
        name: Verification.name,
        schema: VerificationSchema
      }
    ]),
    forwardRef(() => PerformerModule),
    forwardRef(() => UserModule),
    forwardRef(() => SettingModule),
    forwardRef(() => StudioModule),
    forwardRef(() => ReferralModule)
  ],
  providers: [
    AuthService,
    VerificationService,
    AuthGuard,
    RoleGuard
  ],
  controllers: [
    RegisterController,
    LoginController,
    PasswordController,
    PerformerRegisterController,
    PerformerLoginController,
    StudioRegisterController,
    StudioLoginController,
    VerifycationController
  ],
  exports: [
    AuthService,
    VerificationService,
    AuthGuard,
    RoleGuard
  ]
})
export class AuthModule { }
