import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform, plainToInstance } from 'class-transformer';

export class SettingDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  key: string;

  @Expose()
  value: any;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  group = 'system';

  @Expose()
  public = false;

  @Expose()
  type = 'text';

  @Expose()
  visible = true;

  @Expose()
  autoload: boolean;

  @Expose()
  extra: string;

  @Expose()
  @Transform(({ obj }) => obj.meta)
  meta: Record<string, any>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(data?: Partial<SettingDto>) {
    data && Object.assign(this, pick(data, [
      '_id', 'key', 'value', 'name', 'description', 'type', 'visible', 'public', 'meta', 'createdAt', 'updatedAt', 'extra', 'autoload'
    ]));
  }

  public getValue() {
    if (this.type === 'text' && !this.value) {
      return '';
    }

    return this.value;
  }

  public fromModel(model) {
    if (!model) return null;
    return plainToInstance(SettingDto, model.toObject());
  }

  public toPublic() {
    return {
      key: this.key,
      value: this.value
    };
  }
}
