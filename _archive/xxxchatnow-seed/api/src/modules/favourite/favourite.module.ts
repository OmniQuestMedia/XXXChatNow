import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { FavouriteService } from './services';
import { PerformerFavouriteController, UserFavouriteController } from './controllers';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { Favourite, FavouriteSchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Favourite.name,
        schema: FavouriteSchema
      }
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => AuthModule)
  ],
  providers: [FavouriteService],
  controllers: [PerformerFavouriteController, UserFavouriteController],
  exports: [FavouriteService]
})
export class FavouriteModule { }
