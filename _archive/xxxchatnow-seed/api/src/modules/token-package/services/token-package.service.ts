import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import {
  TokenPackageCreatePayload,
  TokenPackageUpdatePayload
} from '../payloads';
import { TokenPackageDto } from '../dtos';
import { TokenPackage } from '../schemas';

@Injectable()
export class TokenPackageService {
  constructor(
    @InjectModel(TokenPackage.name) private readonly TokenPackageModel: Model<TokenPackage>
  ) { }

  public async find(params: Record<string, any>): Promise<Array<TokenPackageDto>> {
    const items = await this.TokenPackageModel.find(params);
    return items.map((item) => plainToInstance(TokenPackageDto, item.toObject()));
  }

  public async findById(id: string | ObjectId): Promise<TokenPackageDto> {
    const item = await this.TokenPackageModel.findById(id);
    if (!item) return null;
    return plainToInstance(TokenPackageDto, item.toObject());
  }

  public async create(payload: TokenPackageCreatePayload): Promise<TokenPackageDto> {
    const data = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tokenPackage = await this.TokenPackageModel.create(data);
    return plainToInstance(TokenPackageDto, tokenPackage.toObject());
  }

  public async update(
    id: string | ObjectId,
    payload: TokenPackageUpdatePayload
  ): Promise<TokenPackageDto> {
    const tokenPackage = await this.findById(id);
    if (!tokenPackage) {
      throw new NotFoundException();
    }
    const data = {
      ...payload,
      updatedAt: new Date()
    };
    await this.TokenPackageModel.updateOne({ _id: tokenPackage._id }, data);

    return this.findById(id);
  }

  public async delete(id: string | ObjectId): Promise<boolean> {
    const tokenPackage = await this.findById(id);
    if (!tokenPackage) {
      throw new NotFoundException();
    }

    await this.TokenPackageModel.deleteOne({ _id: tokenPackage._id });
    return true;
  }

  public async getPublic(id: string): Promise<TokenPackageDto> {
    const tokenPackage = await this.findById(id);
    if (!tokenPackage || !tokenPackage.isActive) {
      throw new EntityNotFoundException();
    }

    return tokenPackage;
  }
}
