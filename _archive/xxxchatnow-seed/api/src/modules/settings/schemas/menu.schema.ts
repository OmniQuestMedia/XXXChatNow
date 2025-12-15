import { HydratedDocument, Schema as MongooseSchema, ObjectId } from 'mongoose';
import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';

@Schema({
  collection: 'menus'
})
export class Menu {
  @Prop()
  title: string;

  @Prop()
  path: string;

  @Prop({
    default: false
  })
  internal: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  parentId: ObjectId;

  @Prop()
  help: string;

  @Prop()
  section: string;

  @Prop({
    default: false
  })
  public: boolean;

  @Prop({
    default: false
  })
  isOpenNewTab: boolean;

  @Prop({
    default: 1
  })
  ordering: number;

  @Prop({
    type: Date,
    default: Date.now
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now
  })
  updatedAt: Date;
}

export type MenuDocument = HydratedDocument<Menu>;

export const MenuSchema = SchemaFactory.createForClass(Menu);
