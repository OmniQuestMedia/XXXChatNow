import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  StringHelper, EntityNotFoundException, QueueEventService, QueueEvent
} from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { CategoryCreatePayload, CategoryUpdatePayload } from '../payloads';
import { POST_CATEGORY_CHANNEL, CATEGORY_EVENTS } from '../constants';
import { Category } from '../schemas';
import { CategoryDto } from '../dtos';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private readonly CategoryModel: Model<Category>,
    private readonly queueEventService: QueueEventService
  ) { }

  public async find(params: FilterQuery<Category>): Promise<CategoryDto[]> {
    const items = await this.CategoryModel.find(params);
    return items.map((item) => plainToInstance(CategoryDto, item.toObject()));
  }

  public async findByIdOrSlug(id: string | ObjectId): Promise<CategoryDto> {
    const query = id instanceof ObjectId || StringHelper.isObjectId(id)
      ? { _id: id }
      : { slug: id };
    const item = await this.CategoryModel.findOne(query);
    if (!item) return null;
    return plainToInstance(CategoryDto, item.toObject());
  }

  public async generateSlug(type: string, title: string, id?: string | ObjectId) {
    // consider if need unique slug with post type
    const slug = StringHelper.createAlias(title);
    const query = { slug, type } as any;
    if (id) {
      query._id = { $ne: id };
    }
    const count = await this.CategoryModel.countDocuments(query);
    if (!count) {
      return slug;
    }

    return this.generateSlug(type, `${slug}1`, id);
  }

  public async create(payload: CategoryCreatePayload, user?: UserDto): Promise<CategoryDto> {
    const data: Record<string, any> = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    if (user) {
      data.createdBy = user._id;
      data.updatedBy = user._id;
    }

    if (payload.parentId) {
      const parent = await this.CategoryModel.findOne({ _id: payload.parentId });
      if (!parent) {
        throw new EntityNotFoundException('Parent category not found!');
      }
    }

    data.slug = await this.generateSlug(payload.type, payload.slug || payload.title);

    const category = await this.CategoryModel.create(data);
    return plainToInstance(CategoryDto, category.toObject());
  }

  public async update(id: string | ObjectId, payload: CategoryUpdatePayload, user?: UserDto): Promise<CategoryDto> {
    const category = await this.findByIdOrSlug(id);
    if (!category) {
      throw new EntityNotFoundException();
    }

    const updateData: Record<string, any> = { ...payload };
    if (payload.parentId && category.parentId && payload.parentId.toString() !== category.parentId.toString()) {
      const parent = await this.CategoryModel.findOne({ _id: payload.parentId });
      if (!parent) {
        throw new EntityNotFoundException('Parent category not found!');
      }
      // TODO - check for the tree
    }
    updateData.parentId = payload.parentId || null;
    if (user) {
      updateData.updatedBy = user._id;
    }
    await this.CategoryModel.updateOne({ _id: category._id }, updateData);
    // TODO - emit event for category update
    return this.findByIdOrSlug(category._id);
  }

  public async delete(id: string | ObjectId): Promise<void> {
    const category = await this.findByIdOrSlug(id);
    if (!category) {
      // should log?
      throw new EntityNotFoundException();
    }
    await this.CategoryModel.deleteOne({ _id: id });
    await this.queueEventService.publish(new QueueEvent({
      channel: POST_CATEGORY_CHANNEL,
      eventName: CATEGORY_EVENTS.DELETED,
      data: category
    }));
    // TODO - fire event for category, then related data will be deleted?
    // Remove sub categories
    if (category.parentId) {
      const children = await this.CategoryModel.find({ parentId: category._id });
      await Promise.all(children.map((c) => this.delete(c)));
    }
  }
}
