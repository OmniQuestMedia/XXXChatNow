import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { merge } from 'lodash';
import { PerformerDto, WatermarkSettingDto } from 'src/modules/performer/dtos';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { plainToInstance } from 'class-transformer';
import { WatermarkSetting, WatermarkSettingDocument } from '../schemas/watermark.schema';
import { WatermarkOptions } from '../inteface';

@Injectable()
export class WatermarkSettingService {
  constructor(
    @InjectModel(WatermarkSetting.name)
    private readonly WatermarkSetting: Model<WatermarkSettingDocument>,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService
  ) { }

  public async findByQuery(payload) {
    return this.WatermarkSetting.find(payload);
  }

  public async findOne(payload) {
    return this.WatermarkSetting.findOne(payload);
  }

  public async create(performer: PerformerDto, payload, file: FileDto) {
    let item = await this.WatermarkSetting.findOne({ sourceId: performer._id });
    if (!item) {
      item = new this.WatermarkSetting();
    }

    const data = { ...payload, sourceId: performer._id };
    if (file) {
      data.watermarkImageId = file._id;
    }

    merge(item, data);
    await item.save();

    if (file) {
      await this.fileService.addRef(file._id, {
        itemId: performer._id,
        itemType: 'watermark'
      });
    }

    return plainToInstance(WatermarkSettingDto, item.toObject());
  }

  public async getPerformerWatermark(performerId: string | ObjectId) {
    const watermarkSetting = await this.WatermarkSetting.findOne({ sourceId: performerId }).lean();
    if (!watermarkSetting) {
      return null;
    }

    const file = await this.fileService.findById(watermarkSetting.watermarkImageId);
    return plainToInstance(WatermarkSettingDto, {
      ...watermarkSetting,
      watermarkImage: file && file.getUrl()
    });
  }

  public async getWatermarkOptions(performer: PerformerDto): Promise<WatermarkOptions> {
    const watermarkSetting = await this.getPerformerWatermark(performer._id);
    if (!watermarkSetting) {
      return null;
    }

    if (watermarkSetting.type === 'text') {
      return {
        type: 'text',
        text: watermarkSetting.watermarkText || performer.username,
        color: watermarkSetting.watermarkColor || '#ffffff',
        fontSize: watermarkSetting.watermarkFontSize || 24,
        opacity: watermarkSetting.watermarkOpacity || 1,
        bottom: watermarkSetting.watermarkBottom || 10,
        top: watermarkSetting.watermarkTop || 20,
        left: watermarkSetting.watermarkLeft || 10,
        align: watermarkSetting.watermarkAlign || 'top'
      };
    }

    const file = watermarkSetting.watermarkImageId && await this.fileService.findById(watermarkSetting.watermarkImageId);
    if (!file) return null;
    return {
      type: 'image',
      filePath: file.absolutePath
    };
  }
}
