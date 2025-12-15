import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel/common';
import { ObjectId } from 'mongodb';
import { FavouriteService } from 'src/modules/favourite/services';
import { UserDto } from 'src/modules/user/dtos';
import { StudioService } from 'src/modules/studio/services';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { SettingService } from 'src/modules/settings';
import { isObjectId } from 'src/kernel/helpers/string.helper';
import { InjectModel } from '@nestjs/mongoose';
import moment = require('moment');
import { PerformerSearchPayload } from '../payloads';
import { PerformerDto } from '../dtos';
import { PERFORMER_STATUSES } from '../constants';
import { CategoryService } from './category.service';
import { BlockSetting, Performer } from '../schemas';

@Injectable()
export class PerformerSearchService {
  constructor(
    @InjectModel(Performer.name) private readonly PerformerModel: Model<Performer>,
    @InjectModel(BlockSetting.name) private readonly BlockSettingModel: Model<BlockSetting>,
    private readonly favoriteService: FavouriteService,
    private readonly studioService: StudioService,
    private readonly settingService: SettingService,
    private readonly categoryService: CategoryService
  ) { }

  // TODO - should create new search service?
  public async search(
    req: PerformerSearchPayload,
    user?: UserDto
  ): Promise<PageableData<Partial<PerformerDto>>> {
    const query = {} as any;
    if (req.q) {
      // eslint-disable-next-line no-useless-escape
      const regexp = new RegExp(req.q.trim().toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace('@', '\\@'), 'i');
      if (!query.$and) { query.$and = []; }

      query.$and.push({
        $or: [
          { name: { $regex: regexp } },
          { username: { $regex: regexp } },
          { email: { $regex: regexp } }
        ]
      });

      // if (!query.$and) {
      //   query.$and = [];
      // }
      // query.$and.push({
      //   $or: [
      //     {
      //       name: { $regex: regexp }
      //     },
      //     {
      //       username: { $regex: regexp }
      //     },
      //     {
      //       email: { $regex: regexp }
      //     }
      //   ]
      // });
    }

    if (req.status) {
      if (req.status === PERFORMER_STATUSES.PENDING) {
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
    if (req.gender) {
      query.gender = req.gender;
    }
    if (req.category) {
      if (isObjectId(req.category)) {
        query.categoryIds = new ObjectId(req.category);
      } else {
        const category = await this.categoryService.findByIdOrSlug(req.category);
        if (category) query.categoryIds = category._id;
      }
    }
    if (req.country) {
      query.country = req.country;
    }
    if (req.tags) {
      query.tags = req.tags;
    }
    if (req.studioId) {
      query.studioId = req.studioId;
      // query.$and.push({ studioId: req.studioId });
    }
    if (req.isOnline) {
      query.isOnline = true;
    }

    if (req.type === 'individual') {
      const ids = (await this.PerformerModel.find({
        studioId: null
      }).select('_id')).map((i: any) => i._id);
      query._id = {
        $in: ids
      };
    }

    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    const [data, total] = await Promise.all([
      this.PerformerModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PerformerModel.countDocuments(query)
    ]);

    let includePrivateInfo = false;
    if (user?.roles && (user.roles.includes('admin') || user.roles.includes('studio'))) {
      includePrivateInfo = true;
    }

    const performerIds = data.map((p) => p._id);
    const studoIds = data.map((p) => p.studioId);
    const [studios, favorites] = await Promise.all([
      studoIds.length ? this.studioService.findByIds(studoIds) : [],
      user && performerIds.length
        ? this.favoriteService.find({
          favoriteId: { $in: performerIds },
          ownerId: user._id
        })
        : []
    ]);

    const performers = data.map((performer) => {
      const isFavorite = favorites.find(
        (f) => f.favoriteId.toString() === performer._id.toString()
      );
      const studio = studios.find(
        (s) => performer.studioId
          && s._id.toString() === performer.studioId.toString()
      );
      return {
        ...performer,
        studioInfo: studio && studio.toResponse(),
        isFavorite: !!isFavorite
      };
    });

    return {
      total,
      data: performers.map((item) => new PerformerDto(item).toResponse(includePrivateInfo))
    };
  }

  public async advancedSearch(
    req: PerformerSearchPayload,
    user?: UserDto,
    countryCode?: string
  ): Promise<PageableData<Partial<PerformerDto>>> {
    const query = {} as any;
    const isAdmin = user?.roles?.includes('admin');
    if (req.q) {
      if (!query.$and) {
        query.$and = [];
      }
      const orQuery = [{
        username: { $regex: req.q, $options: 'i' }
      }] as any;
      if (isAdmin) {
        orQuery.push({
          name: { $regex: req.q, $options: 'i' }
        }, {
          email: { $regex: req.q, $options: 'i' }
        });
      }
      query.$and.push({
        $or: orQuery
      });
    }
    if (req.status) {
      if (req.status === PERFORMER_STATUSES.PENDING) {
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
    if (req.gender) {
      query.gender = req.gender;
    }
    if (req.isOnline) {
      query.isOnline = req.isOnline;
    }
    if (req.category) {
      if (isObjectId(req.category)) {
        query.categoryIds = new ObjectId(req.category);
      } else {
        const category = await this.categoryService.findByIdOrSlug(req.category);
        if (category) query.categoryIds = category._id;
      }
    }
    if (req.country) {
      query.country = req.country;
    }
    if (req.tags) {
      query.tags = req.tags;
    }
    if (req.excludedId) {
      query._id = { $ne: req.excludedId };
    }
    // online status on top priority
    let sort = {
      isOnline: -1,
      'stats.totalTokenEarned': -1,
      onlineAt: -1,
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort,
        isOnline: -1,
        onlineAt: -1,
        balance: -1
      };
    }
    const [data, total] = await Promise.all([
      this.PerformerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PerformerModel.countDocuments(query)
    ]);
    const performerIds = data.map((p) => p._id);
    let favorites: any[] = [];
    let blockUsers: any[] = [];

    if (user) {
      [favorites, blockUsers] = await Promise.all([
        this.favoriteService.find({
          favoriteId: { $in: performerIds },
          ownerId: user._id
        }),
        this.BlockSettingModel.find({
          performerId: { $in: performerIds },
          $or: [
            { userIds: { $in: [user._id] } },
            countryCode ? { countries: { $in: [countryCode] } } : {}
          ]
        })
      ]);
    } else {
      blockUsers = await this.BlockSettingModel.find({
        performerId: { $in: performerIds },
        ...(countryCode ? { countries: { $in: [countryCode] } } : {})
      });
    }

    const [defaultGroupChatPrice, defaultC2CPrice] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.GROUP_CHAT_DEFAULT_PRICE) || 0,
      this.settingService.getKeyValue(SETTING_KEYS.PRIVATE_C2C_PRICE) || 0
    ]);
    const performers = data.map((performer) => {
      const favorite = favorites.length
        && favorites.find(
          (f) => f.favoriteId.toString() === performer._id.toString()
        );
      const blockUser = blockUsers.length
        && blockUsers.find(
          (b) => b.performerId.toString() === performer._id.toString()
        );
      return {
        ...performer,
        privateCallPrice: typeof performer.privateCallPrice !== 'undefined' ? performer.privateCallPrice : defaultC2CPrice,
        groupCallPrice: typeof performer.groupCallPrice !== 'undefined' ? performer.groupCallPrice : defaultGroupChatPrice,
        isFavorite: !!favorite,
        isBlocked: !!blockUser
      };
    });

    return {
      data: performers.map((performer) => new PerformerDto(performer).toSearchResponse()),
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
    const data = await this.PerformerModel.find(query).lean();

    return data;
  }

  public async randomSelect(size: number): Promise<PageableData<any>> {
    const performers = await this.PerformerModel.aggregate([
      { $match: { status: 'active' } },
      { $sample: { size } },
      { $sort: { isOnline: -1, onlineAt: -1, balance: -1 } }
    ]);

    return {
      data: performers.map((p) => new PerformerDto(p).toSearchResponse()),
      total: performers.length
    };
  }

  public async searchNewModel(
    req: PerformerSearchPayload,
    user?: UserDto,
    countryCode?: string
  ): Promise<PageableData<Partial<PerformerDto>>> {
    const query = {} as any;
    const isAdmin = user?.roles?.includes('admin');
    if (req.q) {
      if (!query.$and) {
        query.$and = [];
      }
      const orQuery = [{
        username: { $regex: req.q, $options: 'i' }
      }] as any;
      if (isAdmin) {
        orQuery.push({
          name: { $regex: req.q, $options: 'i' }
        }, {
          email: { $regex: req.q, $options: 'i' }
        });
      }
      query.$and.push({
        $or: orQuery
      });
    }
    if (req.status) {
      if (req.status === PERFORMER_STATUSES.PENDING) {
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
    if (req.gender) {
      query.gender = req.gender;
    }
    if (req.category) {
      query.categoryIds = new ObjectId(req.category);
    }
    if (req.country) {
      query.country = req.country;
    }
    if (req.tags) {
      query.tags = req.tags;
    }
    if (req.excludedId) {
      query._id = { $ne: req.excludedId };
    }
    // online status on top priority
    let sort = {
      isOnline: -1,
      'stats.totalTokenEarned': -1,
      onlineAt: -1,
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort,
        isOnline: -1,
        onlineAt: -1,
        balance: -1
      };
    }

    const [data, total] = await Promise.all([
      this.PerformerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PerformerModel.countDocuments(query)
    ]);

    const newModels = []; // registed last 30 days
    // eslint-disable-next-line no-restricted-syntax
    for (const d of data) {
      const registerDay = moment(d.createdAt);
      const now = moment(Date.now());
      const between = now.diff(registerDay, 'days');
      if (between < 30) {
        newModels.push(d);
      }
    }

    const performerIds = data.map((p) => p._id);
    const [favorites, blockUsers] = await Promise.all([
      user
        ? this.favoriteService.find({
          favoriteId: { $in: performerIds },
          ownerId: user._id
        })
        : [],
      user
        ? this.BlockSettingModel.find({
          performerId: { $in: performerIds },
          $or: [
            {
              userIds: { $in: [user._id] }
            },
            {
              countries: { $in: [countryCode] }
            }
          ]
        })
        : this.BlockSettingModel.find({
          performerId: { $in: performerIds },
          countries: { $in: [countryCode] }
        })
    ]);
    const [defaultGroupChatPrice, defaultC2CPrice] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.GROUP_CHAT_DEFAULT_PRICE) || 0,
      this.settingService.getKeyValue(SETTING_KEYS.PRIVATE_C2C_PRICE) || 0
    ]);
    const performers = newModels.map((performer) => {
      const favorite = favorites.length
        && favorites.find(
          (f) => f.favoriteId.toString() === performer._id.toString()
        );
      const blockUser = blockUsers.length
        && blockUsers.find(
          (b) => b.performerId.toString() === performer._id.toString()
        );
      return {
        ...performer,
        privateCallPrice: typeof performer.privateCallPrice !== 'undefined' ? performer.privateCallPrice : defaultC2CPrice,
        groupCallPrice: typeof performer.groupCallPrice !== 'undefined' ? performer.groupCallPrice : defaultGroupChatPrice,
        isFavorite: !!favorite,
        isBlocked: !!blockUser
      };
    });

    return {
      total,
      data: performers.map((item) => new PerformerDto(item).toSearchResponse())
    };
  }
}
