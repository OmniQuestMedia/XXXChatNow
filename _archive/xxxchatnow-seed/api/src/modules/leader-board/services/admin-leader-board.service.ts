import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { LeaderBoard, LeaderBoardDocument } from '../schema/leader-board.schema';
import { LeaderBoardDto } from '../dtos';

@Injectable()
export class AdminLeaderBoardService {
  constructor(
    @InjectModel(LeaderBoard.name)
    private readonly leaderBoardModel: Model<LeaderBoardDocument>
  ) { }

  public async create(data: any): Promise<LeaderBoardDto> {
    const leaderBoardExisted = await this.leaderBoardModel.findOne({
      type: data.type,
      duration: data.duration
    });

    if (leaderBoardExisted) {
      throw new HttpException('Leaderboard existed!', 400);
    }

    const created = await this.leaderBoardModel.create({
      title: data.title,
      duration: data.duration,
      type: data.type,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return new LeaderBoardDto(created);
  }

  public async find(req: any): Promise<PageableData<LeaderBoardDto>> {
    const query = {};

    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    const [data, total] = await Promise.all([
      this.leaderBoardModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.leaderBoardModel.countDocuments(query)
    ]);

    return {
      data: data.map((leaderBoard) => new LeaderBoardDto(leaderBoard)),
      total
    };
  }

  public async findOne(id: ObjectId): Promise<LeaderBoardDto> {
    const leaderBoard = await this.leaderBoardModel.findById(id);

    if (!leaderBoard) throw new EntityNotFoundException();

    return new LeaderBoardDto(leaderBoard);
  }

  public async updateOne(id: ObjectId, data: any): Promise<any> {
    const leaderBoard = await this.leaderBoardModel.findById(id);

    if (!leaderBoard) throw new EntityNotFoundException();

    return this.leaderBoardModel.updateOne({ _id: id }, { $set: { ...data } });
  }

  public async deleteOne(id: ObjectId): Promise<boolean> {
    const leaderBoard = await this.leaderBoardModel.findById(id);

    if (!leaderBoard) throw new EntityNotFoundException();

    await this.leaderBoardModel.deleteOne({ _id: leaderBoard._id });

    return true;
  }
}
