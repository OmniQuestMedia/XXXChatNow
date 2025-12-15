import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel/common';
import { STATUS } from 'src/kernel/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { UserDto } from '../dtos';
import { UserSearchRequestPayload } from '../payloads';
import { User } from '../schemas/user.schema';

@Injectable()
export class UserSearchService {
  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<User>
  ) { }

  // TODO - should create new search service?
  public async search(
    req: UserSearchRequestPayload
  ): Promise<PageableData<UserDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        },
        {
          email: { $regex: regexp }
        }
      ];
    }
    if (req.role) {
      query.roles = req.role;
    }
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    if (req.status) {
      if (req.status === STATUS.PENDING) {
        if (!query.$and) {
          query.$and = [];
        }
        query.$and.push({
          $or: [{ status: req.status }, { emailVerified: false }]
        });
      } else {
        query.status = req.status;
      }
    }
    const [data, total] = await Promise.all([
      this.UserModel
        .find(query)
        .sort(sort)
        .limit(req.limit)
        .skip(req.offset),
      this.UserModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => plainToInstance(UserDto, item.toObject())),
      total
    };
  }

  public async searchByKeyword(req) {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        },
        {
          email: { $regex: regexp }
        }
      ];
    }
    const data = await this.UserModel
      .find(query)
      .lean();

    return data;
  }
}
