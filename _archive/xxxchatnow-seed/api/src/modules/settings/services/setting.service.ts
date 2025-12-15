import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  EntityNotFoundException,
  QueueEventService,
  QueueEvent,
  getConfig
} from 'src/kernel';
import {
  DELETE_FILE_TYPE,
  FILE_EVENT,
  MEDIA_FILE_CHANNEL
} from 'src/modules/file/services';
import { join } from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { SettingCreatePayload, SettingUpdatePayload } from '../payloads';
import { SettingDto } from '../dtos';
import { SETTING_CHANNEL } from '../constants';
import { Setting } from '../schemas';

@Injectable()
export class SettingService {
  static _settingCache = {} as Map<string, any>;

  // key and value
  static _publicSettingsCache = {} as Record<string, any>;

  constructor(
    @InjectModel(Setting.name) private readonly SettingModel: Model<Setting>,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      SETTING_CHANNEL,
      'HANDLE_SETTINGS_CHANGE',
      this.subscribeChange.bind(this)
    );
  }

  private async publishChange(setting: SettingDto) {
    await this.queueEventService.publish(
      new QueueEvent({
        channel: SETTING_CHANNEL,
        eventName: 'update',
        data: new SettingDto(setting)
      })
    );
  }

  private async subscribeChange(event: QueueEvent) {
    // TODO - update directly to static variable?
    const { data } = event;
    if (data.meta && data.value && data.meta.upload) {
      const { settingDir } = getConfig('file');
      const fileName = data.value.replace(
        `${getConfig('file').baseUrl}/settings/`,
        ''
      );
      this.queueEventService.publish(
        new QueueEvent({
          channel: MEDIA_FILE_CHANNEL,
          eventName: FILE_EVENT.FILE_RELATED_MODULE_UPDATED,
          data: {
            type: DELETE_FILE_TYPE.FILE_PATH,
            currentFile: join(settingDir, fileName)
          }
        })
      );
    }
    await this.syncCache();
  }

  public async syncCache(): Promise<void> {
    const settings = await this.SettingModel.find();
    // eslint-disable-next-line no-restricted-syntax
    for (const setting of settings) {
      const dto = new SettingDto(setting);
      SettingService._settingCache[dto.key] = dto;
      if (dto.visible && dto.public) {
        SettingService._publicSettingsCache[dto.key] = dto.value;
      }
    }
  }

  async get(key: string): Promise<SettingDto> {
    if (SettingService._settingCache[key]) {
      return SettingService._settingCache[key];
    }

    // TODO - handle events when settings change and reupdate here
    const data = await this.SettingModel.findOne({ key });
    if (!data) {
      return null;
    }
    const dto = new SettingDto(data);
    SettingService._settingCache[key] = dto;
    return dto;
  }

  async getKeyValue(key: string): Promise<any> {
    if (SettingService._settingCache[key]) {
      return SettingService._settingCache[key].value;
    }

    // TODO - handle events when settings change and reupdate here
    const data = await this.SettingModel.findOne({ key });
    if (!data) {
      return null;
    }
    const dto = new SettingDto(data);
    SettingService._settingCache[key] = dto;
    return dto.value;
  }

  async create(data: SettingCreatePayload): Promise<SettingDto> {
    const setting = await this.get(data.key);
    if (setting) {
      throw new Error('Setting key exist');
    }

    // reupdate the setting list
    // TODO - must publish and subscribe to redis channel, so all instances (if run multiple)
    // have the same data
    await this.syncCache();
    const model = await this.SettingModel.create(data);
    return plainToInstance(SettingDto, model.toObject());
  }

  async update(key: string, data: SettingUpdatePayload): Promise<SettingDto> {
    const setting = await this.SettingModel.findOne({ key });
    if (!setting) {
      throw new EntityNotFoundException();
    }
    data.description && setting.set('description', data.description);
    data.name && setting.set('name', data.name);
    setting.set('value', data.value);
    await setting.save();
    const dto = new SettingDto(setting);
    await this.publishChange(dto);
    return dto;
  }

  // get public and visible settings
  getPublicSettings(): Record<string, any> {
    return SettingService._publicSettingsCache;
  }

  async getAutoloadPublicSettingsForUser(): Promise<Record<string, any>> {
    const autoloadSettings = {} as any;
    // return SettingService._publicSettingsCache;
    return Object.keys(SettingService._settingCache).reduce((settings, key) => {
      const results = settings;
      if (SettingService._settingCache[key].autoload && SettingService._publicSettingsCache[key]) {
        results[key] = SettingService._settingCache[key].value;
      }
      return results;
    }, autoloadSettings);
  }

  getPublicValueByKey(key: string) {
    return {
      value: SettingService._publicSettingsCache[key]?.value || null
    };
  }

  getPublicValueByKeys(keys: string[]) {
    return keys.reduce((lp, key) => {
      const results = lp;
      results[key] = SettingService._publicSettingsCache[key] || null;
      return results;
    }, {} as any);
  }

  async getValueByKeys(keys: string[]) {
    return keys.reduce((lp, key) => {
      const results = lp;
      results[key] = SettingService._settingCache[key]?.value || null;
      return results;
    }, {} as any);
  }

  /**
   * get all settings which are editable
   */
  async getEditableSettings(group?: string): Promise<SettingDto[]> {
    const query = { editable: true } as any;
    if (group) {
      query.group = group;
    }
    const settings = await this.SettingModel.find(query);
    return settings.map((s) => new SettingDto(s));
  }

  public static getByKey(key: string) {
    return SettingService._settingCache[key] || null;
  }

  public static getValueByKey(key: string) {
    return SettingService._settingCache[key]
      ? SettingService._settingCache[key].value
      : null;
  }
}
