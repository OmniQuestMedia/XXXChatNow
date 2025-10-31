import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { AdminSearch } from '../payloads';
import { Post } from '../schemas';
import { PostDto } from '../dtos';

@Injectable()
export class PostSearchService {
  constructor(
    @InjectModel(Post.name) private readonly PostModel: Model<Post>
  ) { }

  // TODO - define post DTO
  public async adminSearch(req: AdminSearch): Promise<PageableData<PostDto>> {
    const query = {} as any;
    if (req.q) {
      query.$or = [
        {
          title: { $regex: req.q }
        }
      ];
    }
    if (req.status) {
      query.status = req.status;
    }
    const sort: any = {
      [req.sortBy || 'updatedAt']: req.sort
    };
    const [data, total] = await Promise.all([
      this.PostModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PostModel.countDocuments(query)
    ]);

    if (data.length) {
      const authorIds = data.map((p) => p.authorId);
      if (authorIds.length) {
        // const authors = await this.userService.findByIds(authorIds);
        // TODO - load users here
      }
    }

    return {
      data: data.map((item) => plainToInstance(PostDto, item.toObject())), // TODO - define mdoel
      total
    };
  }
}
