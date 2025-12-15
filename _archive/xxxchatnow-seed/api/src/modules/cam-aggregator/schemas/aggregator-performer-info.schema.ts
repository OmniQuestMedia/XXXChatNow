import {
  Prop, Schema, SchemaFactory,
  raw
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'aggregatorperformerinfos'
})
export class AggregatorPerfomer {
  @Prop({
    index: true
  })
  service: string;

  @Prop()
  servicePerformerId: string;

  @Prop({
    index: true
  })
  gender: string;

  @Prop()
  avatar: string;

  @Prop({
    index: true
  })
  username: string;

  @Prop()
  dateOfBirth: Date;

  @Prop()
  age: number;

  @Prop()
  isOnline: boolean;

  @Prop()
  isStreaming: boolean;

  @Prop()
  watching: number;

  @Prop(raw({
    views: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    }
  }))
  stats: {
    views: number;
    favorites: number;
  };

  @Prop()
  streamingStatus: string;

  @Prop()
  country: string;

  @Prop()
  countryFlag: string;

  @Prop()
  city: string;

  @Prop({
    type: [{
      type: String
    }]
  })
  languages: string[];

  @Prop()
  aboutMe: string;

  @Prop({
    type: [{
      type: String
    }],
    index: true
  })
  tags: string[];

  @Prop()
  iframe: string;

  @Prop()
  profileLink: string;

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

export type AggregatorPerfomerDocument = HydratedDocument<AggregatorPerfomer>;

export const AggregatorPerfomerSchema = SchemaFactory.createForClass(AggregatorPerfomer);

AggregatorPerfomerSchema.index({
  isOnline: 1,
  service: 1,
  tags: 1,
  stats: 1,
  updatedAt: 1
});

AggregatorPerfomerSchema.index({
  service: 1,
  username: 1
});
