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

    const menus = data.map((item) => MenuDto.fromModel(item).toUserResponse());
    return this.buildMenuTree(menus);
  }

  /**
   * Build hierarchical menu tree from flat menu list
   * @param menus Flat list of menus
   * @returns Hierarchical menu tree
   */
  private buildMenuTree(menus: any[]): any[] {
    const menuMap = new Map();
    const roots = [];

    // First pass: create map of all menus by ID
    menus.forEach((menu) => {
      menuMap.set(menu._id.toString(), { ...menu, children: [] });
    });

    // Second pass: build tree structure
    menus.forEach((menu) => {
      const menuWithChildren = menuMap.get(menu._id.toString());
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId.toString());
        if (parent) {
          parent.children.push(menuWithChildren);
        } else {
          // Parent not found, treat as root
          roots.push(menuWithChildren);
        }
      } else {
        roots.push(menuWithChildren);
      }
    });

    // Clean up empty children arrays
    const cleanEmptyChildren = (node: any) => {
      if (node.children && node.children.length === 0) {
        delete node.children;
      } else if (node.children) {
        node.children.forEach(cleanEmptyChildren);
      }
    };

    roots.forEach(cleanEmptyChildren);

    return roots;
  }
}
