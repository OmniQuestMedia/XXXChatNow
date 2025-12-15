import { ForbiddenException, Injectable } from '@nestjs/common';
import { PerformerDto } from 'src/modules/performer/dtos';
import { Model } from 'mongoose';
import { EntityNotFoundException } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { StreamGoalPayload } from '../payloads';
import { StreamService } from '.';
import { StreamGoalResponse } from '../interface';
import { StreamGoalDto } from '../dtos';
import { StreamGoal } from '../schemas';

@Injectable()

export class StreamGoalsService {
  constructor(
    @InjectModel(StreamGoal.name) private readonly streamGoal: Model<StreamGoal>,

    private readonly streamService: StreamService
  ) {}

  async create(
    streamId: string,
    payload: StreamGoalPayload,
    currentUser: PerformerDto
  ): Promise<StreamGoalResponse> {
    const stream = await this.streamService.findById(streamId);
    if (!stream) throw new EntityNotFoundException();

    if (!stream.performerId.equals(currentUser._id)) {
      throw new ForbiddenException();
    }

    const goal = await this.streamGoal.findOne({
      streamId: stream._id
    });

    if (!goal) {
      await this.streamGoal.create({
        performerId: stream.performerId,
        streamId: stream._id
      });
    }

    await this.streamGoal.updateOne({
      streamId: stream._id
    }, {
      $set: {
        goals: payload.goals
      }
    });

    return StreamGoalDto.fromModel(goal);
  }

  public async loadGoals(streamId: string): Promise<any> {
    const stream = await this.streamService.findById(streamId);
    if (!stream) throw new EntityNotFoundException();

    const goal = await this.streamGoal.findOne({
      streamId: stream._id
    });

    if (!goal) return { success: false };

    return StreamGoalDto.fromModel(goal);
  }

  public async updateRemainBalance(streamId, token) {
    const stream = await this.streamService.findById(streamId);
    if (!stream) return;

    await this.streamGoal.updateOne({ streamId: stream._id }, { $inc: { remainToken: token } });
  }

  public async resetRemainBalance(streamId, currentUser: PerformerDto) {
    const stream = await this.streamService.findById(streamId);
    if (!stream) return;

    if (!stream.performerId.equals(currentUser._id)) throw new ForbiddenException();

    await this.streamGoal.updateOne({ streamId: stream._id }, { $set: { remainToken: 0 } });
  }
}
