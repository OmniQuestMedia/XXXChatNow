import { Injectable } from '@nestjs/common';
import {
  PageableData,
  EntityNotFoundException,
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { EVENT } from 'src/kernel/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from '../../performer/services';
import { FavouriteSearchPayload } from '../payload';
import { FavouriteDto } from '../dtos';
import { PERFORMER_FAVORITE_CHANNEL } from '../constants';
import { Favourite } from '../schemas';

@Injectable()
export class FavouriteService {
  constructor(
    @InjectModel(Favourite.name) private readonly FavouriteModel: Model<Favourite>,
    private readonly performerService: PerformerService,
    private readonly userService: UserService,
    private readonly queueEventService: QueueEventService
  ) { }

  public async find(params: FilterQuery<Favourite>): Promise<FavouriteDto[]> {
    const favorites = await this.FavouriteModel.find(params);
    return favorites.map((f) => plainToInstance(FavouriteDto, f.toObject()));
  }

  public async findOne(params: FilterQuery<Favourite>): Promise<FavouriteDto> {
    const favorite = await this.FavouriteModel.findOne(params);
    if (!favorite) return null;
    return plainToInstance(FavouriteDto, favorite.toObject());
  }

  async findById(id: string | ObjectId): Promise<FavouriteDto> {
    const favourite = await this.FavouriteModel.findById(id);
    if (!favourite) return null;
    return plainToInstance(FavouriteDto, favourite.toObject());
  }

  async doLike(favoriteId: string, ownerId: ObjectId): Promise<{ success: boolean }> {
    const performer = await this.performerService.findById(favoriteId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    let favourite = await this.FavouriteModel.findOne({ favoriteId, ownerId });
    if (!favourite) {
      favourite = new this.FavouriteModel();
      favourite.ownerId = ownerId;
      favourite.favoriteId = performer._id;
      await favourite.save();
    }
    this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_FAVORITE_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          performerId: favoriteId
        }
      })
    );
    return { success: true };
  }

  async doUnlike(favoriteId: string, ownerId: ObjectId): Promise<{ success: boolean }> {
    const performer = await this.performerService.findById(favoriteId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const favourite = await this.FavouriteModel.findOne({
      favoriteId,
      ownerId
    });
    if (!favourite) {
      return { success: false };
    }

    await favourite.deleteOne();
    this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_FAVORITE_CHANNEL,
        eventName: EVENT.DELETED,
        data: {
          performerId: favoriteId
        }
      })
    );
    return { success: true };
  }

  async userSearch(
    req: FavouriteSearchPayload,
    currentUser: UserDto
  ): Promise<PageableData<FavouriteDto>> {
    const query = {} as any;
    query.ownerId = currentUser._id;
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.FavouriteModel.find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.FavouriteModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.favoriteId);
    const performers = performerIds.length
      ? await this.performerService.findByIds(performerIds)
      : [];

    const favourites = data.map((favourite) => {
      const performer = favourite.favoriteId
        && performers.find(
          (p) => p._id.toString() === favourite.favoriteId.toString()
        );

      if (performer) {
        performer.isFavorite = true;
      }
      const dto = plainToInstance(FavouriteDto, favourite);
      dto.setPerformer(performer);
      return dto;
    });

    return {
      total,
      data: favourites
    };
  }

  async performerSearch(
    req: FavouriteSearchPayload,
    currentUser: PerformerDto
  ): Promise<PageableData<Partial<FavouriteDto>>> {
    const query = {} as any;
    query.favoriteId = currentUser._id;
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.FavouriteModel.find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.FavouriteModel.countDocuments(query)
    ]);

    const userIds = data.map((d) => d.ownerId);
    const users = userIds.length
      ? await this.userService.findByIds(userIds)
      : [];

    const favourites = data.map((favourite) => {
      const user = favourite.ownerId
        && users.find(
          (u) => u._id.toString() === favourite.ownerId.toString()
        );
      const dto = plainToInstance(FavouriteDto, favourite);
      dto.setUser(user);

      return dto;
    });

    return {
      total,
      data: favourites
    };
  }

  async getAllFollowerIdsByPerformerId(performerId: string | ObjectId) {
    const favourites = await this.FavouriteModel.find({ favoriteId: performerId });
    return favourites.map((f) => f.ownerId);
  }
}
