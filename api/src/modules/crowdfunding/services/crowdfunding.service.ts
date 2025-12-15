import { PerformerDto } from 'src/modules/performer/dtos';
import { Injectable } from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { PerformerService } from 'src/modules/performer/services';
import { EntityNotFoundException, ForbiddenException, PageableData } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { CrowdfundingCreatePayload, CrowdfundingSearchPayload, CrowdfundingUpdatePayload } from '../payloads';
import { CrowdfundingDto } from '../dtos/crowdfunding.dto';
import { Crowdfunding } from '../schemas';

@Injectable()
export class CrowdfundingService {
  constructor(
    @InjectModel(Crowdfunding.name) private readonly CrowdfundingModel: Model<Crowdfunding>,

    private readonly performerService: PerformerService
  ) {}

  public async createCrowdfunding(payload: CrowdfundingCreatePayload, user: PerformerDto): Promise<CrowdfundingDto> {
    const performer = await this.performerService.findById(user._id);

    if (!performer) {
      throw new ForbiddenException();
    }

    const { title, descriptions, token } = payload;

    if (!payload.title || !payload.descriptions || !payload.token) {
      throw new ForbiddenException();
    }

    const post = await this.CrowdfundingModel.create({
      title,
      descriptions,
      token,
      performerId: performer._id
    });

    return CrowdfundingDto.fromModel(post);
  }

  public async listCrowdfunding(req: CrowdfundingSearchPayload): Promise<PageableData<CrowdfundingDto>> {
    const query = {} as any;

    if (req.performerId) query.performerId = req.performerId;

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort
    };

    const [data, total] = await Promise.all([
      this.CrowdfundingModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.CrowdfundingModel.countDocuments(query)
    ]);

    return {
      data: data.map((d) => plainToInstance(CrowdfundingDto, d)),
      total
    };
  }

  public async getById(id, user: PerformerDto): Promise<CrowdfundingDto> {
    const crowdfunding = await this.CrowdfundingModel.findOne({ _id: id });

    if (!crowdfunding) {
      throw new EntityNotFoundException();
    }

    if (crowdfunding.performerId.toString() !== user._id.toString()) {
      throw new ForbiddenException();
    }

    return CrowdfundingDto.fromModel(crowdfunding);
  }

  public async updateById(id: ObjectId, payload: CrowdfundingUpdatePayload): Promise<any> {
    const crowdfunding = await this.CrowdfundingModel.findOne({ _id: id });

    if (!crowdfunding) {
      throw new EntityNotFoundException();
    }

    await this.CrowdfundingModel.updateOne(
      { _id: crowdfunding._id },
      {
        $set: {
          ...payload
        }
      }
    );

    return { success: true };
  }

  public async deleteById(id, user: PerformerDto): Promise<any> {
    const crowdfunding = await this.CrowdfundingModel.findOne({ _id: id });

    if (!crowdfunding) {
      throw new EntityNotFoundException();
    }

    const performer = await this.performerService.findById(user._id);

    if (!performer) {
      throw new EntityNotFoundException();
    }

    if (crowdfunding.performerId.toString() === performer._id.toString()) {
      await this.CrowdfundingModel.deleteOne({ _id: crowdfunding._id });
    }

    return { success: true };
  }

  public async userGetCrowdfunding(req: CrowdfundingSearchPayload): Promise<PageableData<CrowdfundingDto>> {
    if (!req.performerId) {
      throw new ForbiddenException();
    }

    const query = {} as any;
    query.performerId = req.performerId;

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort
    };

    const [data, total] = await Promise.all([
      this.CrowdfundingModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.CrowdfundingModel.countDocuments(query)
    ]);

    return {
      data: data.map((d) => plainToInstance(CrowdfundingDto, d)),
      total
    };
  }
}
