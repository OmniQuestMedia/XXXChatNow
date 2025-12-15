import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TokenPackageSearchService, TokenPackageService } from './services';
import {
  TokenPackageController,
  AdminTokenPackageController
} from './controllers';
import { TokenPackage, TokenPackageSchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TokenPackage.name,
        schema: TokenPackageSchema
      }
    ]),
    forwardRef(() => AuthModule)
  ],
  providers: [
    TokenPackageService,
    TokenPackageSearchService
  ],
  controllers: [AdminTokenPackageController, TokenPackageController],
  exports: [TokenPackageService, TokenPackageSearchService]
})
export class TokenPackageModule { }
