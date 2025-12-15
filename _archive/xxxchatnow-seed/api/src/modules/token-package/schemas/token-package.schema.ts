import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'tokenpackages'
})
export class TokenPackage {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({
    default: 0
  })
  ordering: number;

  @Prop()
  price: number;

  @Prop()
  tokens: number;

  @Prop({
    default: true
  })
  isActive: boolean;

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

export type TokenPackageDocument = HydratedDocument<TokenPackage>;

export const TokenPackageSchema = SchemaFactory.createForClass(TokenPackage);
TokenPackageSchema.index({ isActive: 1, ordering: 1 }, {
  name: 'idx_isActive_ordering'
});
