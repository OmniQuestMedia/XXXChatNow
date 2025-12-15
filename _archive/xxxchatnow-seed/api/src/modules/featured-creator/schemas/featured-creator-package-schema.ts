import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'featured_creator_packages'
})
export class FeaturedCreatorPackage {
  @Prop({ type: String })
  name: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  description: string;

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

export type FeaturedCreatorPackageDocument = HydratedDocument<FeaturedCreatorPackage>;

export const FeaturedCreatorPackageSchema = SchemaFactory.createForClass(FeaturedCreatorPackage);
