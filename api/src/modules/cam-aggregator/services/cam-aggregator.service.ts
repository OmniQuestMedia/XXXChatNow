import { Injectable } from '@nestjs/common';
import {
  FilterQuery, Model, ObjectId, SortOrder
} from 'mongoose';
import {
  AgendaService, EntityNotFoundException, PageableData, StringHelper
} from 'src/kernel';
import { uniq } from 'lodash';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { COUNTRIES } from 'src/modules/utils/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { DBLoggerService } from 'src/modules/logger';
import { XLoveCamService } from './xlovecam.service';
import { ChaturbateService } from './chaturbate.service';
import { BongacamsService } from './bongacams.service';
import { StripcashService } from './stripcash.service';
import { AggregatorCategory, AggregatorCategoryDocument } from '../schemas/aggregator-category.schema';
import { AggregatorPerfomer, AggregatorPerfomerDocument } from '../schemas';
import { AggregatorCategoryDto, AggregatorPerformerDto } from '../dtos';

@Injectable()
export class CamAggregatorService {
  constructor(
    @InjectModel(AggregatorCategory.name) private readonly AggregatorCategoryModel: Model<AggregatorCategoryDocument>,
    @InjectModel(AggregatorPerfomer.name) private readonly AggregatorPerfomerModel: Model<AggregatorPerfomerDocument>,
    private readonly settingService: SettingService,
    private readonly xLoveCamService: XLoveCamService,
    private readonly chaturbateService: ChaturbateService,
    private readonly bongaCamsService: BongacamsService,
    private readonly stripcashService: StripcashService,
    private readonly agendaService: AgendaService,
    private readonly logger: DBLoggerService
  ) {
    this.defineJobs();
  }

  private async defineJobs() {
    const collection = (this.agendaService as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [
          'syncXLoveCamPerformerData',
          'syncBongaCamsPerformerData',
          'syncChaturbatePerformerData',
          'syncStripcashPerformerData'
        ]
      }
    });
    this.agendaService.define('syncXLoveCamPerformerData', this.syncXLoveCamModels.bind(this));
    this.agendaService.schedule('10 seconds from now', 'syncXLoveCamPerformerData', {});

    this.agendaService.define('syncBongaCamsPerformerData', this.syncBongaCamsModels.bind(this));
    this.agendaService.schedule('10 seconds from now', 'syncBongaCamsPerformerData', {});

    this.agendaService.define('syncChaturbatePerformerData', this.syncChaturbateModels.bind(this));
    this.agendaService.schedule('10 seconds from now', 'syncChaturbatePerformerData', {});

    this.agendaService.define('syncStripcashPerformerData', this.syncStripcashodels.bind(this));
    this.agendaService.schedule('10 seconds from now', 'syncStripcashPerformerData', {});
  }

  public static detectCountry(text: string) {
    // detect name, code, language or text include in the name
    if (!text) return null;
    let lowerCase = text.toLocaleLowerCase();
    if (lowerCase === 'english') lowerCase = 'us';
    return COUNTRIES.find((country) => {
      const cName = country.name.toLowerCase();
      const cName2 = country.code?.toLowerCase() || '';
      const lName = country.language?.name?.toLowerCase() || '';
      const lName2 = country.language?.code?.toLowerCase() || '';
      if ([cName, cName2, lName, lName2].includes(lowerCase)) {
        return true;
      }
      // detect in language
      // otherwise detect if split name by special chars?
      let others = [];
      if (text.includes('-')) {
        others = text.split('-');
      } else if (text.includes(';')) {
        others = text.split(';');
      } else if (text.includes(',')) {
        others = text.split(',');
      } else {
        return false;
      }
      if (!others.length) return false;
      let i = others.length - 1;
      while (i >= 0) {
        if (others[i]
          && [cName, cName2, lName, lName2].includes(others[i].toLowerCase().trim())) {
          return true;
        }
        i -= 1;
      }

      return false;
    });
  }

  public async getCategories(query: FilterQuery<AggregatorCategory> = {}): Promise<AggregatorCategory[]> {
    const items = await this.AggregatorCategoryModel.find(query);
    return items.map((item) => plainToInstance(AggregatorCategoryDto, item.toObject()));
  }

  public async getCategory(id: string | ObjectId): Promise<AggregatorCategoryDto> {
    const category = await this.AggregatorCategoryModel.findOne({ _id: id });
    if (!category) throw new EntityNotFoundException();

    return plainToInstance(AggregatorCategoryDto, category.toObject());
  }

  public async getCategoryByAlias(alias: string): Promise<AggregatorCategoryDto> {
    const category = await this.AggregatorCategoryModel.findOne({ alias });
    if (!category) throw new EntityNotFoundException();

    return plainToInstance(AggregatorCategoryDto, category.toObject());
  }

  public async updateCategory(id: string, payload: Record<string, any>): Promise<AggregatorCategoryDto> {
    const category = await this.AggregatorCategoryModel.findOne({ _id: id });
    if (!category) throw new EntityNotFoundException();

    if (payload.tags) category.tags = payload.tags;
    if (payload.active !== null) category.active = payload.active;
    if (payload.name) category.name = payload.name;
    if (payload.metaTitle) category.metaTitle = payload.metaTitle;
    if (payload.metaKeywords) category.metaKeywords = payload.metaKeywords;
    if (payload.metaDescription) category.metaDescription = payload.metaDescription;
    // eslint-disable-next-line no-useless-escape
    if (payload.alias) category.alias = payload.alias.replace(/["~!@#$%^&*\(\)_+=`{}\[\]\|\\:;'<>,.\/?"\- \t\r\n]+/g, '-');
    await category.save();

    return plainToInstance(AggregatorCategoryDto, category.toObject());
  }

  public async listOnline(options?: any): Promise<PageableData<AggregatorPerformerDto>> {
    const [
      xlovecam,
      bongacams,
      stripcash,
      chaturbate
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_XLOVECAM_ENABLED),
      this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_BONGACAMS_ENABLED),
      this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_STRIPCASH_ENABLED),
      this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_CHATURBATE_ENABLED)
    ]);

    const inServices = [];
    if (xlovecam) inServices.push('xlovecam');
    if (bongacams) inServices.push('bongacams');
    if (stripcash) inServices.push('stripcash');
    if (chaturbate) inServices.push('chaturbate');
    if (!inServices.length) {
      return {
        data: [],
        total: 0
      };
    }

    const {
      limit = 60,
      offset = 0,
      category = null,
      gender = null,
      tag = null,
      q = null,
      country = null
    } = options;
    const query: FilterQuery<AggregatorPerfomer> = {
      isOnline: true,
      service: {
        $in: inServices
      }
    };
    const sort: Record<string, SortOrder> = {
      // isOnline: -1,
      'stats.views': -1,
      'stats.favorites': -1,
      updatedAt: -1
    };
    if (category !== null && category.length > 0) {
      const cat = await this.AggregatorCategoryModel.findOne({ alias: category });
      if (cat) {
        query.tags = {
          $in: cat.tags
        };
      }
    }
    if (gender) query.gender = gender;
    if (tag) query.tags = tag;
    if (country) query.country = country.toUpperCase();
    if (q) {
      query.$or = [{
        username: {
          $regex: q,
          $options: 'i'
        }
      }, {
        tags: q
      }];

      // allow to search offline model
      delete query.isOnline;
    }
    const [data, total] = await Promise.all([
      this.AggregatorPerfomerModel
        .find(query)
        .limit(parseInt(limit, 10))
        .skip(parseInt(offset, 10))
        .sort(sort),
      this.AggregatorPerfomerModel.countDocuments(query)
    ]);

    return {
      data: data.map((item) => plainToInstance(AggregatorPerformerDto, item.toObject())),
      total
    };
  }

  public async getDetails(key: string, username: string): Promise<AggregatorPerformerDto> {
    // x - xlovecam
    // b - bongacams
    // s - stripcash
    // c - chaturbate
    const query = { username } as any;
    switch (key) {
      case 'x': case 'xlovecam':
        query.service = 'xlovecam';
        break;
      case 'b': case 'bongacams':
        query.service = 'bongacams';
        break;
      case 's': case 'stripcash':
        query.service = 'stripcash';
        break;
      case 'c': case 'chaturbate':
        query.service = 'chaturbate';
        break;
      default: break;
    }

    const detail = await this.AggregatorPerfomerModel.findOne(query);
    if (!detail) throw new EntityNotFoundException();

    const dto = plainToInstance(AggregatorPerformerDto, detail.toObject());

    if (detail.service === 'chaturbate' && !detail.iframe?.includes(`https://chaturbate.com/embed/${detail.username}`)) {
      const [
        campaign,
        tour
      ] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_CHATURBATE_CAMPAIGN),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_CHATURBATE_TOUR)
      ]);
      dto.iframe = `https://chaturbate.com/embed/${detail.username}/?join_overlay=1&campaign=${campaign}&disable_sound=0&bgcolor=white%27&tour=${tour}&amp=&room=${detail.username}`;
    }
    return dto;
  }

  public async getRelatedCams(username: string, options: Record<string, any> = {}): Promise<AggregatorPerformerDto[]> {
    const [
      xlovecam,
      bongacams,
      stripcash,
      chaturbate
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_XLOVECAM_ENABLED),
      this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_BONGACAMS_ENABLED),
      this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_STRIPCASH_ENABLED),
      this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_CHATURBATE_ENABLED)
    ]);

    const inServices = [];
    if (xlovecam) inServices.push('xlovecam');
    if (bongacams) inServices.push('bongacams');
    if (stripcash) inServices.push('stripcash');
    if (chaturbate) inServices.push('chaturbate');
    if (!inServices.length) return [];

    const limit = options?.limit || 20;
    const aggregate = await this.AggregatorPerfomerModel
      .aggregate([{
        $match: {
          isOnline: true,
          service: {
            $in: inServices
          },
          username: {
            $ne: username
          }
        }
      }, {
        $sample: {
          size: limit
        }
      }]);
    if (!aggregate) return [];
    return aggregate.map((item) => plainToInstance(AggregatorPerformerDto, item));
  }

  private async syncXLoveCamModels(job) {
    try {
      const [xLoveCamEnabled, authItemId, authSecret, authServiceId] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_XLOVECAM_ENABLED),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_XLOVECAM_AUTH_ITEM_ID),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_XLOVECAM_AUTH_SECRET),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_XLOVECAM_AUTH_SERVICE_ID)
      ]);
      if (!xLoveCamEnabled || !authItemId || !authSecret) throw new Error('Missing config!');

      const onlineModelUsernames = [];
      // offset not work
      // for (let offset = 0; offset <= 490; offset += 10) {
      //   // eslint-disable-next-line no-await-in-loop
      //   const onlineModels = await this.xLoveCamService.listOnline({
      //     offset,
      //     authItemId,
      //     authSecret,
      //     authServiceId
      //   });
      //   // eslint-disable-next-line no-restricted-syntax
      //   for (const model of onlineModels) {
      //     // eslint-disable-next-line no-await-in-loop
      //     await this.AggregatorPerfomerModel.updateOne({
      //       service: model.service,
      //       username: model.username
      //     }, model, {
      //       upsert: true
      //     });
      //     onlineModelUsernames.push(model.username);
      //   }
      // }
      const onlineModels = await this.xLoveCamService.listOnline({
        offset: 0,
        authItemId,
        authSecret,
        authServiceId
      });
      await onlineModels.reduce(async (lp, model) => {
        await lp;
        await this.AggregatorPerfomerModel.updateOne({
          service: model.service,
          username: model.username
        }, model, {
          upsert: true
        });
        onlineModelUsernames.push(model.username);
        return Promise.resolve();
      }, Promise.resolve());
      await this.AggregatorPerfomerModel.updateMany({
        service: 'xlovecam',
        username: {
          $nin: onlineModelUsernames
        }
      }, {
        isStreaming: false,
        isOnline: false
      });
    } catch (e) {
      this.logger.error(e.stack || e);
    } finally {
      job.remove();
      this.agendaService.schedule('1 minutes from now', 'syncXLoveCamPerformerData', {});
    }
  }

  private async syncBongaCamsModels(job) {
    try {
      const [bongacamsEnabled, bongacamsC] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_BONGACAMS_ENABLED),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_BONGACAMS_C)
      ]);
      if (!bongacamsEnabled || !bongacamsC) throw new Error('Missing config!');

      const onlineModelUsernames = [];
      const onlineModels = await this.bongaCamsService.listOnline({
        c: bongacamsC
      });
      await onlineModels.reduce(async (lp, model) => {
        await lp;
        await this.AggregatorPerfomerModel.updateOne({
          service: model.service,
          username: model.username
        }, model, {
          upsert: true
        });
        onlineModelUsernames.push(model.username);
        return Promise.resolve();
      }, Promise.resolve());

      await this.AggregatorPerfomerModel.updateMany({
        username: {
          $nin: onlineModelUsernames
        },
        service: 'bongacams'
      }, {
        isStreaming: false,
        isOnline: false
      });
    } catch (e) {
      this.logger.error(e.stack || e);
    } finally {
      job.remove();
      this.agendaService.schedule('1 minute from now', 'syncBongaCamsPerformerData', {});
    }
  }

  private async syncChaturbateModels(job) {
    try {
      const [chaturbateEnabled, campaign, tour, wm, type] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_CHATURBATE_ENABLED),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_CHATURBATE_CAMPAIGN),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_CHATURBATE_TOUR),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_CHATURBATE_WM),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_CHATURBATE_TYPE)
      ]);
      if (!chaturbateEnabled) throw new Error('Missing config!');

      const onlineModelUsernames = [];
      for (let offset = 0; offset <= 400; offset += 100) {
        // eslint-disable-next-line no-await-in-loop
        const onlineModels = await this.chaturbateService.listOnline({
          offset,
          campaign: campaign || '',
          tour,
          wm,
          type
        });
        // eslint-disable-next-line no-await-in-loop
        await onlineModels.reduce(async (lp, model) => {
          await lp;
          await this.AggregatorPerfomerModel.updateOne({
            service: model.service,
            username: model.username
          }, model, {
            upsert: true
          });
          onlineModelUsernames.push(model.username);
          return Promise.resolve();
        }, Promise.resolve());
      }

      await this.AggregatorPerfomerModel.updateMany({
        username: {
          $nin: onlineModelUsernames
        },
        service: 'chaturbate'
      }, {
        isStreaming: false,
        isOnline: false
      });
    // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
      job.remove();
      this.agendaService.schedule('30 seconds from now', 'syncChaturbatePerformerData', {});
    }
  }

  private async syncStripcashodels(job) {
    try {
      const [stripcashEnabled, userId, apiKey] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_STRIPCASH_ENABLED),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_STRIPCASH_USER_ID),
        this.settingService.getKeyValue(SETTING_KEYS.CAM_AGG_STRIPCASH_API_KEY)
      ]);
      if (!stripcashEnabled || !userId) throw new Error('Missing config!');

      const onlineModelUsernames = [];
      const onlineModels = await this.stripcashService.listOnline({
        userId
      }, {
        Authorization: `Bearer ${apiKey}`
      });
      // eslint-disable-next-line no-restricted-syntax
      for (const model of onlineModels) {
        // eslint-disable-next-line no-await-in-loop
        await this.AggregatorPerfomerModel.updateOne({
          service: model.service,
          username: model.username
        }, model, {
          upsert: true
        });
        onlineModelUsernames.push(model.username);
      }

      await this.AggregatorPerfomerModel.updateMany({
        username: {
          $nin: onlineModelUsernames
        },
        service: 'stripcash'
      }, {
        isStreaming: false,
        isOnline: false
      });
    // eslint-disable-next-line no-empty
    } catch (e) {
      this.logger.error(e.stack || e);
    } finally {
      job.remove();
      this.agendaService.schedule('1 minute from now', 'syncStripcashPerformerData', {});
    }
  }

  // dont need this
  public async syncTags() {
    const aggregator = await this.AggregatorPerfomerModel.aggregate([{
      $group: {
        _id: null,
        tagsArray: {
          $addToSet: '$tags'
        }
      }
    }]) as any;
    if (!aggregator) return;
    const tags = [];
    aggregator[0].tagsArray.forEach((tagItems) => tags.push(...tagItems));
    const uniqueTags = uniq(tags).filter((tag) => !!tag);
    if (!uniqueTags?.length) return;
    // create SEO tag and add to DB

    await uniqueTags.reduce(async (lp, tag) => {
      await lp;

      const alias = StringHelper.createAlias(tag);
      // eslint-disable-next-line no-await-in-loop
      const tagItem = await this.AggregatorCategoryModel.findOne({ alias });
      if (!tagItem) {
        // eslint-disable-next-line no-await-in-loop
        await this.AggregatorCategoryModel.create({
          name: tag,
          alias,
          tags: [tag]
        });
      }
      return Promise.resolve();
    }, Promise.resolve());
  }
}
