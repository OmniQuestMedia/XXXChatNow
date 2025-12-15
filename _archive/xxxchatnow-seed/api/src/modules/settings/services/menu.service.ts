import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { merge } from 'lodash';
import { PageableData } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { MenuDto } from '../dtos';
import { MenuCreatePayload, MenuSearchRequestPayload, MenuUpdatePayload } from '../payloads';
import { Menu } from '../schemas';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu.name) private readonly MenuModel: Model<Menu>
  ) { }

  public async checkOrdering(ordering: number, id?: string | ObjectId) {
    const query = { ordering } as any;
    if (id) {
      query._id = { $ne: id };
    }
    const count = await this.MenuModel.countDocuments(query);
    if (!count) {
      return ordering;
    }
    return this.checkOrdering(ordering + 1, id);
  }

  public async findById(id: string | ObjectId): Promise<MenuDto> {
    const query = { _id: id };
    const menu = await this.MenuModel.findOne(query);
    return MenuDto.fromModel(menu);
  }

  public async create(payload: MenuCreatePayload): Promise<MenuDto> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    data.ordering = await this.checkOrdering(payload.ordering || 0);
    const menu = await this.MenuModel.create(data);
    return MenuDto.fromModel(menu);
  }

  public async update(
    id: string | ObjectId,
    payload: MenuUpdatePayload
  ): Promise<MenuDto> {
    const menu = await this.MenuModel.findById(id);
    if (!menu) throw new NotFoundException();

    const data = {
      ...payload,
      updatedAt: new Date()
    } as any;
    data.ordering = await this.checkOrdering(payload.ordering || 0, menu._id);
    merge(menu, data);
    await menu.save();
    return MenuDto.fromModel(menu);
  }

  public async delete(id: string | ObjectId): Promise<boolean> {
    const menu = await this.findById(id);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
    await this.MenuModel.deleteOne({ _id: id });
    return true;
  }

  public async search(
    req: MenuSearchRequestPayload
  ): Promise<PageableData<MenuDto>> {
    const query = {} as any;
    if (req.q) {
      query.$or = [
        {
          title: { $regex: req.q }
        }
      ];
    }
    if (req.section) {
      query.section = req.section;
    }
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.MenuModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.MenuModel.countDocuments(query)
    ]);

    return {
      data: data.map((item) => MenuDto.fromModel(item)), // TODO - define mdoel
      total
    };
  }

  public async getAllActiveMenus(section = null): Promise<Partial<MenuDto>[]> {
    const query = {
      // public: true
    } as any;
    if (section) query.section = section;
    const data = await this.MenuModel
      .find(query)
      .sort({
        ordering: 1
      });

    return data.map((item) => MenuDto.fromModel(item).toUserResponse());
  }
}
