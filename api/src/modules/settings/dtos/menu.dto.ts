import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { plainToInstance } from 'class-transformer';

export class MenuDto {
  _id?: ObjectId;

  title?: string;

  path?: string;

  internal?: boolean;

  parentId?: string;

  help?: string;

  section?: string;

  public?: boolean;

  ordering?: number;

  isOpenNewTab?: boolean;

  createdAt?: Date;

  updatedAt?: Date;

  constructor(data?: Partial<MenuDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'title',
        'path',
        'internal',
        'parentId',
        'help',
        'section',
        'public',
        'ordering',
        'isOpenNewTab',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  public toUserResponse() {
    return {
      _id: this._id,
      title: this.title,
      path: this.path,
      internal: this.internal,
      // not support parent ID in FE right now
      // parentId: this.parentId,
      section: this.section,
      ordering: this.ordering,
      isOpenNewTab: this.isOpenNewTab
    };
  }

  public static fromModel(model) {
    if (!model) return null;

    return plainToInstance(MenuDto, model.toObject());
  }
}
