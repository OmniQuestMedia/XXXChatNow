import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'posts'
})
export class Post {
  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  authorId: MongooseSchema.Types.ObjectId;

  @Prop({
    index: true
  })
  type: string;

  @Prop()
  title: string;

  @Prop({
    index: true,
    unique: true
  })
  slug: string;

  @Prop()
  content: string;

  @Prop()
  shortDescription: string;

  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;

  @Prop()
  metaKeyword: string;

  @Prop()
  canonicalUrl: string;

  @Prop({
    type: [{
      type: MongooseSchema.Types.ObjectId
    }]
  })
  categoryIds: Array<MongooseSchema.Types.ObjectId>;

  // store all related categories such as parent ids int search filter
  @Prop({
    type: [{
      type: MongooseSchema.Types.ObjectId
    }]
  })
  categorySearchIds: Array<MongooseSchema.Types.ObjectId>;

  @Prop({
    default: 'draft'
  })
  status: string;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  image: any;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  updatedBy: MongooseSchema.Types.ObjectId;

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

export type PostDocument = HydratedDocument<Post>;

export const PostSchema = SchemaFactory.createForClass(Post);
