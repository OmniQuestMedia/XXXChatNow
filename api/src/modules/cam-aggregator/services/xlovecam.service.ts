/* eslint-disable camelcase */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { chunk } from 'lodash';
import { stringify } from 'querystring';
import { lastValueFrom } from 'rxjs';
import { EntityNotFoundException } from 'src/kernel';

@Injectable()
export class XLoveCamService {
  constructor(
    private httpService: HttpService
  ) {
  }

  public async listOnline({
    lang = 'en',
    searchtxt = '',
    // hd, vote, connexion, suggest, alpha, creation, rating, love, price, fav, random
    order = 'rating',
    category = '', // 1 - 13
    s_language = '',
    price = '',
    age = '',
    boobs = '',
    hair_color = '',
    hair_length = '',
    eyes = '', // 1 - 5
    height = '', // 1-6
    weight = '', // 1-6
    ethnic_group = '', // 1-5
    tags = '', // 1 - 60
    sex_apparence = '', // 1 - 3
    body_apparence = '', // 1-3
    sex_size = '', // 1 - 3
    chat = 'free', // free, prive
    offset = 0, // 0 - 2000
    limit = 300, // 1 - 2000
    authServiceId = '2',
    authItemId = '',
    authSecret = ''
  }): Promise<any> {
    // const authServiceId = '2';
    // const authItemId = '18856';
    // const authSecret = '63389fc7199e9f7bf6c7ac63057cec86';
    const data = {
      authServiceId,
      authItemId,
      authSecret,
      lang,
      searchtxt,
      order,
      category,
      s_language,
      price,
      age,
      boobs,
      hair_color,
      hair_length,
      eyes,
      height,
      weight,
      ethnic_group,
      tags,
      sex_apparence,
      body_apparence,
      sex_size,
      chat,
      offset,
      limit
    };
    const filter = Object.keys(data).filter((k) => !!data[k]).reduce((results, k) => {
      // eslint-disable-next-line no-param-reassign
      results[k] = data[k];
      return results;
    }, {} as Record<string, any>);
    const resp = await lastValueFrom(this.httpService.post('https://webservice-affiliate.xlovecam.com/model/listonline', stringify(filter), {
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    }));

    const models = resp.data?.content?.models_list || [];

    const modelIds = models.map((m) => m.model_id);

    const profiles = await Promise.all(chunk(modelIds, 10).map((arr) => this.getDetails(arr, {
      authServiceId,
      authItemId,
      authSecret
    })));

    const detailsData = profiles.reduce((details, content) => ({
      ...details,
      ...content
    }), {});

    return models.reduce((details, model) => {
      const detail = detailsData[model.model_id];
      if (detail) {
        const modelData = {
          id: model.model_id,
          avatar: model.model_profil_photo,
          username: model.nick,
          dateOfBirth: null,
          phone: null,
          isOnline: true,
          watching: null,
          gender: detail.model?.sex === 'F' ? 'female' : 'male',
          isStreaming: true,
          isFavorite: false,
          socials: false,
          stats: {
            favorites: Number(model.nbloves),
            views: Number(model.nbloves)
          },
          lastStreamingTime: null,
          streamingStatus: model.show_type === 'free' ? 'public' : 'private',
          streamingTitle: detail.infoByLang?.phantasm,
          country: null,
          countryFlag: null,
          city: null,
          state: null,
          zipcode: null,
          address: null,
          languages: ['English'],
          categoryIds: [],
          categories: [],
          service: 'xlovecam',
          aboutMe: detail.infoByLang?.description,
          iframe: detail?.camLive,
          profileLink: model.model_link,
          age: model.age
        };

        details.push(modelData);
      }

      return details;
    }, []);
  }

  public async getDetails(modelIds, options = {
    authServiceId: '2',
    authItemId: '18856',
    authSecret: '63389fc7199e9f7bf6c7ac63057cec86'
  }) {
    const { authServiceId, authItemId, authSecret } = options;
    let data = stringify({
      authServiceId,
      authItemId,
      authSecret
    });
    modelIds.forEach((id) => {
      data += `&modelid[]=${id}`;
    });

    const resp = await lastValueFrom(this.httpService.post('https://webservice-affiliate.xlovecam.com/model/getprofileinfo', data, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    }));

    return resp.data?.content || {};
  }

  public async getDetails2(modelId) {
    const authServiceId = '2';
    const authItemId = '18856';
    const authSecret = '63389fc7199e9f7bf6c7ac63057cec86';
    const data = stringify({
      authServiceId,
      authItemId,
      authSecret,
      'modelid[]': modelId
    });

    const resp = await lastValueFrom(this.httpService.post('https://webservice-affiliate.xlovecam.com/model/getprofileinfo', data, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    }));

    const jsonData = resp.data?.content || {};

    if (!jsonData[modelId]) throw new EntityNotFoundException();
    const { model } = jsonData[modelId];
    const photos = Object.keys(model.photos).map((key) => model.photos[key]);
    return {
      _id: modelId,
      avatar: photos?.length ? photos[0].thumbnail : null,
      username: model.nick,
      dateOfBirth: null,
      phone: null,
      isOnline: true,
      watching: null,
      gender: model?.sex === 'F' ? 'female' : 'male',
      isStreaming: true,
      isFavorite: false,
      socials: false,
      stats: {},
      lastStreamingTime: null,
      streamingStatus: model.show_type === 'free' ? 'public' : 'private',
      streamingTitle: jsonData[modelId].infoByLang?.phantasm,
      country: null,
      city: null,
      state: null,
      zipcode: null,
      address: null,
      languages: ['English'],
      categoryIds: [],
      categories: [],
      service: 'xlovecam',
      aboutMe: jsonData[modelId].infoByLang?.description,
      photos
    };
  }
}
