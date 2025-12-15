import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { stringify } from 'querystring';
import { lastValueFrom } from 'rxjs';
import { CamAggregatorService } from './cam-aggregator.service';

@Injectable()
export class ChaturbateService {
  constructor(
    private httpService: HttpService
  ) {
  }

  private getGender(gender: string) {
    switch (gender) {
      case 'f': return 'female';
      case 'm': return 'male';
      case 't': return 'transgender';
      case 'c': return 'couple';
      default: return gender;
    }
  }

  public async listOnline(newOptions?: any): Promise<any> {
    const options = {
      wm: 'ZCn7T',
      client_ip: 'request_ip',
      format: 'json',
      limit: 100,
      offset: 0,
      // exhibitionist: '',
      // gender: '', // m, f, t, c
      // region: '', // asia | europe_russia | northamerica | southamerica | other
      // tag: '',
      // hd: '',
      ...(newOptions || {})
    };
    const resp = await lastValueFrom(this.httpService
      .get(`https://chaturbate.com/api/public/affiliates/onlinerooms/?${stringify(options)}`));
    const models = resp.data?.results || [];

    return models.map((model) => {
      const country = CamAggregatorService.detectCountry(model.location)
        || CamAggregatorService.detectCountry(model.spoken_languages);
      return {
        id: model.username,
        avatar: model.image_url,
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
          views: model.num_users,
          favorites: model.num_followers
        },
        lastStreamingTime: null,
        streamingStatus: model.current_show,
        streamingTitle: '',
        country: country?.code || null,
        countryFlag: country?.flag || null,
        city: null,
        state: null,
        zipcode: null,
        address: null,
        languages: (model.spoken_languages || '').split(','),
        categoryIds: [],
        categories: [],
        service: 'chaturbate',
        aboutMe: model.room_subject,
        tags: model.tags,
        iframe: options.camAggChaturbateType === 'revshare' ? model.iframe_embed_revshare : model.iframe_embed,
        profileLink: options.camAggChaturbateType === 'revshare' ? model.chat_room_url_revshare : model.chat_room_url,
        age: model.age,
        updatedAt: moment().add(-1 * (model.seconds_online || 0), 'seconds').toDate()
      };
    });
  }
}
