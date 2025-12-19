import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { stringify } from 'querystring';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { CamAggregatorService } from './cam-aggregator.service';

@Injectable()
export class BongacamsService {
  constructor(
    private httpService: HttpService
  ) {
  }

  private getGender(gender: string) {
    const lowerCase = (gender || '').toLowerCase();
    if (lowerCase.includes('couple')) return 'couple';
    if (lowerCase.includes('transgender')) return 'transgender';
    if (lowerCase.includes('female')) return 'female';
    if (lowerCase.includes('male')) return 'male';

    return lowerCase;
  }

  public async listOnline(newOptions?: any): Promise<any> {
    const options = {
      type: 'api',
      api_type: 'json',
      c: '694510',
      api_v: '1',
      ...(newOptions || {})
    };
    const resp = await lastValueFrom(this.httpService
      .get(`https://bngpt.com/promo.php?${stringify(options)}`));

    const models = resp.data || [];

    return models.map((model) => {
      const country = CamAggregatorService.detectCountry(model.homecountry)
        || CamAggregatorService.detectCountry(model.primary_language)
        || CamAggregatorService.detectCountry(model.primary_language_key);
      return {
        id: model.username,
        avatar: model.profile_images?.profile_image,
        username: model.username,
        dateOfBirth: model.birthday,
        phone: null,
        isOnline: true,
        watching: null,
        gender: this.getGender(model.gender),
        isStreaming: true,
        isFavorite: false,
        socials: false,
        stats: {
          favorites: model.members_count,
          views: model.members_count
        },
        lastStreamingTime: null,
        streamingStatus: model.chat_status,
        streamingTitle: '',
        country: country?.code || null,
        countryFlag: country?.flag || null,
        city: null,
        state: null,
        zipcode: null,
        address: null,
        languages: [model.primary_language],
        categoryIds: [],
        categories: [],
        service: 'bongacams',
        aboutMe: model.turns_on,
        tags: model.tags,
        iframe: model.embed_chat_url,
        profileLink: model.chat_url_on_home_page,
        age: model.display_age,
        updatedAt: moment().add(-1 * (model.online_time || 0), 'seconds').toDate()
      };
    });
  }
}
