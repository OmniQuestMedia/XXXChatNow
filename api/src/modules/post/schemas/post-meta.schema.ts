import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'postmetas'
})
export class PostMeta {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    required: true
  })
  postId: MongooseSchema.Types.ObjectId;

  @Prop({
    index: true
  })
  key: string;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  value: any;

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

export type PostMetaDocument = HydratedDocument<PostMeta>;

export const PostMetaSchema = SchemaFactory.createForClass(PostMeta);

PostMetaSchema.index({ postId: 1, key: 1 }, {
  name: 'idx_postId_key'
});
