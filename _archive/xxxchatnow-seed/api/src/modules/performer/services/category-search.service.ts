import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { CategorySearchRequestPayload } from '../payloads';
import { PerformerCategoryDto } from '../dtos';
import { Category } from '../schemas';

@Injectable()
export class CategorySearchService {
  constructor(
    @InjectModel(Category.name) private readonly CategoryModel: Model<Category>
  ) { }

  // TODO - define category DTO
  public async search(
    req: CategorySearchRequestPayload
  ): Promise<PageableData<PerformerCategoryDto>> {
    const query = {} as any;
    if (req.q) {
      query.$or = [
        {
          name: { $regex: req.q }
        }
      ];
    }
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.CategoryModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.CategoryModel.countDocuments(query)
    ]);

    return {
      data: data.map((d) => plainToInstance(PerformerCategoryDto, d)),
      total
    };
  }
}
