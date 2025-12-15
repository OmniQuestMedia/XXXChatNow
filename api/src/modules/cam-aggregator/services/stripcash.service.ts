import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { stringify } from 'querystring';
import { CamAggregatorService } from './cam-aggregator.service';

@Injectable()
export class StripcashService {
  constructor(
    private httpService: HttpService
  ) {
  }

  public async listOnline(newOptions = {}, headers = {}): Promise<any> {
    const options = {
      limit: 0,
      offset: 0,
      // status: 'public',
      // userId: '106150bfbb9ac378aac92fb495c8ed29229e11b849b66525428d363cec90b9fd',
      ...(newOptions || {})
    } as any;
    const resp = await lastValueFrom(this.httpService
      .get(`https://go.rmhfrtnd.com/app/models-ext/models?${stringify(options)}`, { headers }));
    const models = resp.data?.models || resp.data?.results || [];
    const CDNDefaultHost = resp.data?.CDNDefaultHost || 'doppiocdn.net';

    return models.filter((model) => model.status === 'public').map((model) => {
      const country = CamAggregatorService.detectCountry(model.modelsCountry);
      return {
        id: model.username,
        avatar: model.previewUrlThumbSmall || model.previewUrl,
        username: model.username,
        dateOfBirth: model.birthday,
        phone: null,
        isOnline: true,
        watching: null,
        gender: model.gender,
        isStreaming: true,
        isFavorite: false,
        socials: false,
        stats: {
          views: model.viewersCount,
          favorites: model.favoritedCount
        },
        lastStreamingTime: null,
        streamingStatus: model.status,
        streamingTitle: model.goalMessage,
        country: country?.code || null,
        countrFlag: country?.flag || null,
        city: null,
        state: null,
        zipcode: null,
        address: null,
        languages: model.languages,
        categoryIds: [],
        categories: [],
        service: 'stripcash',
        aboutMe: model.goalMessage,
        tags: model.tags.map((tag) => (tag.split('/')[1] ? tag.split('/')[1] : '')),
        iframe: model?.stream?.url.replace(/{cdnHost}/gi, CDNDefaultHost),
        profileLink: model.clickUrl, // `https://go.gldrdr.com/?userId=${options.userId}&path=/cams/${model.username}`,
        age: model.age,
        updatedAt: moment(model.statusChangedAt).toDate()
      };
    });
  }
}
