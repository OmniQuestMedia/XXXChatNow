import {
  Injectable, ConflictException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { StringHelper, EntityNotFoundException } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { CategoryCreatePayload, CategoryUpdatePayload } from '../payloads';
import { Category, CategoryDocument } from '../schemas';
import { PerformerCategoryDto } from '../dtos';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private readonly CategoryModel: Model<CategoryDocument>
  ) { }

  public async find(params: any): Promise<PerformerCategoryDto[]> {
    const items = await this.CategoryModel.find(params);
    return items.map((item) => plainToInstance(PerformerCategoryDto, item.toObject()));
  }

  public async findByIdOrSlug(id: string | ObjectId): Promise<PerformerCategoryDto> {
    const query = id instanceof ObjectId || StringHelper.isObjectId(id) ? { _id: id } : { slug: id };
    const item = await this.CategoryModel.findOne(query);
    if (!item) return null;

    return plainToInstance(PerformerCategoryDto, item.toObject());
  }

  public async generateSlug(name: string, id?: string | ObjectId) {
    // consider if need unique slug with type
    const slug = StringHelper.replaceSpace(name);
    const query = { slug } as any;
    if (id) {
      query._id = { $ne: id };
    }
    const count = await this.CategoryModel.countDocuments(query);
    if (!count) {
      return slug;
    }

    return this.generateSlug(`${slug}1`, id);
  }

  public async create(payload: CategoryCreatePayload, user?: UserDto): Promise<PerformerCategoryDto> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    } as any;
    if (user) {
      data.createdBy = user._id;
      data.updatedBy = user._id;
    }
    const orderingCheck = await this.CategoryModel.countDocuments({
      ordering: payload.ordering
    });
    if (orderingCheck) {
      throw new ConflictException('Ordering is duplicated');
    }
    data.slug = await this.generateSlug(payload.slug || payload.name);

    const category = await this.CategoryModel.create(data);
    return plainToInstance(PerformerCategoryDto, category.toObject());
  }

  public async update(id: string | ObjectId, payload: CategoryUpdatePayload, user?: UserDto): Promise<PerformerCategoryDto> {
    const category = await this.findByIdOrSlug(id);
    if (!category) {
      throw new EntityNotFoundException();
    }

    const orderingCheck = await this.CategoryModel.countDocuments({
      ordering: payload.ordering,
      _id: { $ne: category._id }
    });
    if (orderingCheck) {
      throw new ConflictException('Ordering is duplicated');
    }

    const data: Record<string, any> = {
      ...payload,
      slug: await this.generateSlug(payload.slug || payload.name, category._id)
    };
    if (user) {
      data.updatedBy = user._id;
    }
    await this.CategoryModel.updateOne({ _id: category._id }, data);

    return this.findByIdOrSlug(id);
  }

  public async delete(id: string | ObjectId): Promise<void> {
    const category = await this.findByIdOrSlug(id);
    if (!category) {
      throw new EntityNotFoundException();
    }
    await this.CategoryModel.deleteOne({ _id: id });
  }
}
