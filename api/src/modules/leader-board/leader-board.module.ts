import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminLeaderBoardService, LeaderBoardService } from './services';
import { AdminLeaderBoardController, LeaderBoardController } from './controllers';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { EarningModule } from '../earning/earning.module';
import { LeaderBoard, LeaderBoardSchema } from './schema/leader-board.schema';
import { Earning, EarningSchema } from './schema/earning.schema';
// import { Earning, EarningSchema } from "./schema/earning.schema"; // nếu cần

@Module({
  imports: [
    UserModule,
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => EarningModule),
    MongooseModule.forFeature([
      { name: LeaderBoard.name, schema: LeaderBoardSchema },
      { name: Earning.name, schema: EarningSchema }
    ])
  ],
  providers: [AdminLeaderBoardService, LeaderBoardService],
  controllers: [LeaderBoardController, AdminLeaderBoardController],
  exports: [LeaderBoardService, AdminLeaderBoardService]
})
export class LeaderBoardModule { }
