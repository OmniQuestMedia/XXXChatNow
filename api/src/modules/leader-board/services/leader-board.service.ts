import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import * as moment from 'moment';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { LeaderBoard, LeaderBoardDocument } from '../schema/leader-board.schema';
import { Earning, EarningDocument } from '../schema/earning.schema';

@Injectable()
export class LeaderBoardService {
  constructor(
    @InjectModel(LeaderBoard.name)
    private readonly leaderBoardModel: Model<LeaderBoardDocument>,
    private readonly performerService: PerformerService,
    private readonly userService: UserService,
    @InjectModel(Earning.name)
    private readonly earningModel: Model<EarningDocument>
  ) { }

  public async getAllLeaderBoard() {
    const leaderboards = await this.leaderBoardModel.find({
      status: 'active'
    });
    if (!leaderboards.length) return [];

    const data = await Promise.all(leaderboards.map((leaderboard) => {
      switch (leaderboard.type) {
        case 'totalSpent':
          return this.searchByTotalSpent(leaderboard);
        default:
          return this.searchByTotalEarned(leaderboard);
      }
    }));

    return data;
  }

  public async searchByTotalSpent(leaderboard: LeaderBoardDocument) {
    let n = 0;
    switch (leaderboard.duration) {
      case 'last_month':
        n = 30;
        break;
      case 'last_year':
        n = 365;
        break;
      case 'last_week':
        n = 7;
        break;
      default:
        n = 1;
        break;
    }
    const data = await this.earningModel.aggregate([{
      $match: {
        createdAt: {
          $gt: moment().subtract(n, 'days').startOf('day').toDate()
        }
      }
    }, {
      $group: {
        _id: '$userId',
        total: { $sum: '$grossPrice' }
      }
    }, {
      $sort: {
        total: -1
      }
    }, {
      $limit: 100
    }]);

    const userIds = data.map((u) => u._id);
    const users = await this.userService.find({
      _id: { $in: userIds },
      status: 'active'
    });

    return {
      ...leaderboard.toObject(),
      data: data
        .filter((d) => {
          const user = d._id && users.find((u) => u._id.toString() === d._id.toString());
          return user;
        })
        .map((d) => {
          const user = users.find((u) => u._id.toString() === d._id.toString());

          return {
            total: d.total,
            user: new UserDto(user).toResponse()
          };
        })
    };
  }

  public async searchByTotalEarned(leaderboard: LeaderBoardDocument) {
    let n = 0;
    switch (leaderboard.duration) {
      case 'last_month':
        n = 30;
        break;
      case 'last_year':
        n = 365;
        break;
      case 'last_week':
        n = 7;
        break;
      default:
        n = 1;
        break;
    }
    const data = await this.earningModel.aggregate([{
      $match: {
        createdAt: {
          $gt: moment().subtract(n, 'days').startOf('day').toDate()
        }
      }
    }, {
      $group: {
        _id: '$performerId',
        total: { $sum: '$netPrice' }
      }
    }, {
      $sort: {
        total: -1
      }
    }, {
      $limit: 100
    }]);

    const performerIds = data.map((p) => p._id);
    const performers = await this.performerService.find({
      _id: { $in: performerIds },
      status: 'active'
    });

    return {
      ...leaderboard.toObject(),
      data: data
        .filter((d) => {
          const user = d._id && performers.find((u) => u._id.toString() === d._id.toString());
          return user;
        })
        .map((d) => {
          const user = performers.find((u) => u._id.toString() === d._id.toString());

          return {
            total: d.total,
            user: new PerformerDto(user).toSearchResponse()
          };
        })
    };
  }
}
