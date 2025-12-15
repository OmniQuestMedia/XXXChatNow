import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { InjectModel } from '@nestjs/mongoose';
import { WheelModel } from '../models';
import { WheelSearchRequestPayload } from '../payloads';
import { WheelDto } from '../dtos';

@Injectable()
export class WheelSearchService {
  constructor(
    @InjectModel('wheelOption')
    private readonly wheelModel: Model<WheelModel>
  ) { }

  public async search(
    req: WheelSearchRequestPayload
  ): Promise<PageableData<WheelDto>> {
    const query = {} as any;
    if (req.q) {
      query.$or = [
        {
          name: { $regex: new RegExp(req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''), 'i') }
        },
        {
          description: { $regex: new RegExp(req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''), 'i') }
        }
      ];
    }
    if (req.status) {
      query.status = req.status;
    }
    if (req.performerId) {
      query.performerId = toObjectId(req.performerId);
    }
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.wheelModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? Number(req.limit) : 10)
        .skip(Number(req.offset)),
      this.wheelModel.countDocuments(query)
    ]);

    return {
      data: data.map((item) => new WheelDto(item)),
      total
    };
  }
}
