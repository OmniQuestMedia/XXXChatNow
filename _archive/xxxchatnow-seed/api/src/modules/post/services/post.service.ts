import { Injectable, NotFoundException } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  StringHelper,
  EntityNotFoundException,
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { isObjectId } from 'src/kernel/helpers/string.helper';
import { FileService } from 'src/modules/file/services';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { PostDto } from '../dtos';
import { PostCreatePayload } from '../payloads/post-create.payload';
import { POST_CATEGORY_CHANNEL, CATEGORY_EVENTS } from '../constants';
import { Post, PostMeta } from '../schemas';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private readonly PostModel: Model<Post>,
    @InjectModel(Post.name) private readonly PostMetaModel: Model<PostMeta>,

    private readonly fileService: FileService,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      POST_CATEGORY_CHANNEL,
      'HANDLE_POST_CATEGORY',
      this.categoryChangeUpdater.bind(this)
    );
  }

  public async find(params: FilterQuery<Post>): Promise<Array<PostDto>> {
    const items = await this.PostModel.find(params);
    return items.map((item) => plainToInstance(PostDto, item.toObject()));
  }

  public async findByIdOrSlug(id: string | ObjectId): Promise<PostDto> {
    const query = id instanceof ObjectId || StringHelper.isObjectId(id)
      ? { _id: id }
      : { slug: id };
    const item = await this.PostModel.findOne(query);
    if (!item) return null;
    return plainToInstance(PostDto, item.toObject());
  }

  public async generateSlug(title: string, id?: string | ObjectId) {
    // consider if need unique slug with post type
    const slug = StringHelper.createAlias(title);
    const query = { slug } as any;
    if (id) {
      query._id = { $ne: id };
    }
    const count = await this.PostModel.countDocuments(query);
    if (!count) {
      return slug;
    }

    return this.generateSlug(`${slug}1`, id);
  }

  public async create(payload: PostCreatePayload, user?: UserDto): Promise<PostDto> {
    const data: Record<string, any> = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    if (user && !data.authorId) {
      data.authorId = user._id;
    }
    data.slug = await this.generateSlug(payload.slug || payload.title);

    const post = await this.PostModel.create(data);
    if (payload.meta && Array.isArray(payload.meta)) {
      await Promise.all(
        payload.meta.map((meta) => this.PostMetaModel.create({
          ...meta,
          postId: post._id
        }))
      );
    }

    return plainToInstance(PostDto, post.toObject());
  }

  public async update(
    id: string | ObjectId,
    payload: PostCreatePayload,
    user?: UserDto
  ): Promise<PostDto> {
    const post = await this.findByIdOrSlug(id);
    if (!post) {
      throw new NotFoundException();
    }
    const updateData: Record<string, any> = {
      ...payload,
      updatedAt: new Date()
    };
    if (payload.slug) updateData.slug = await this.generateSlug(payload.slug, post._id);
    if (user) updateData.updatedBy = user._id;

    await this.PostModel.updateOne({ _id: post._id }, updateData);

    // Update meta data if have
    if (payload.meta && Array.isArray(payload.meta)) {
      await Promise.all(
        payload.meta.map((metaData) => this.PostModel.updateOne(
          {
            postId: post._id,
            key: metaData.key
          },
          {
            postId: post._id,
            key: metaData.key,
            value: metaData.value
          },
          {
            upsert: true
          }
        ))
      );
    }

    return this.findByIdOrSlug(post._id);
  }

  public async delete(id: string | ObjectId): Promise<boolean> {
    const post = await this.findByIdOrSlug(id);
    if (!post) {
      throw new NotFoundException();
    }

    await this.PostModel.deleteOne({ _id: post._id });
    await this.PostMetaModel.deleteMany({ postId: post._id });

    return true;
  }

  public async adminGetDetails(id: string): Promise<PostDto> {
    const [post, meta] = await Promise.all([
      this.findByIdOrSlug(id),
      this.PostMetaModel.find({ postId: id })
    ]);
    // TODO - populate data hook?
    if (!post) {
      throw new EntityNotFoundException();
    }
    post.meta = meta;
    return post;
  }

  public async getPublic(id: string): Promise<PostDto> {
    const post = await this.findByIdOrSlug(id);
    if (!post || !['active', 'published'].includes(post.status)) {
      throw new EntityNotFoundException();
    }

    let image = post.image as any;
    if (isObjectId(post.image)) {
      const file = await this.fileService.findById(post.image);
      if (file) {
        image = file.toPublicResponse();
      }
    }

    post.image = image;
    return post;
  }

  private async categoryChangeUpdater(event: QueueEvent) {
    try {
      if (event.eventName !== CATEGORY_EVENTS.DELETED) {
        return;
      }

      // TODO - check if need to convert string to ObjectId
      const categoryId = event.data._id;
      await this.PostModel.updateMany(
        {
          categoryIds: categoryId
        },
        {
          $pull: {
            categoryIds: categoryId,
            categorySearchIds: categoryId
          }
        }
      );
    } catch (e) {
      // TODO - log me
    }
  }
}
