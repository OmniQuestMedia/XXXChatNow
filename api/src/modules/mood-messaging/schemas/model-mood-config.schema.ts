import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

/**
 * Custom Response Configuration
 * Stores model's custom responses for specific mood buckets
 */
@Schema({
  _id: false
})
export class CustomResponse {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true
  })
  bucketId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0;
      },
      message: 'Custom responses array must contain at least one response'
    }
  })
  responses: string[];
}

const CustomResponseSchema = SchemaFactory.createForClass(CustomResponse);

/**
 * Mood Messaging Settings
 * Configuration options for automated responses
 */
@Schema({
  _id: false
})
export class MoodMessagingSettings {
  @Prop({
    default: false
  })
  autoRespond: boolean;

  @Prop({
    default: 2,
    min: 0,
    max: 60
  })
  responseDelay: number;

  @Prop({
    default: 100,
    min: 0,
    max: 1000
  })
  dailyLimit: number;
}

const MoodMessagingSettingsSchema = SchemaFactory.createForClass(MoodMessagingSettings);

/**
 * ModelMoodConfig Schema
 * Stores model-specific mood messaging configuration
 */
@Schema({
  collection: 'modelmoodconfigs'
})
export class ModelMoodConfig {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    unique: true,
    index: true,
    ref: 'Performer'
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    default: [],
    ref: 'MoodBucket'
  })
  enabledBuckets: (ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId)[];

  @Prop({
    type: [CustomResponseSchema],
    default: []
  })
  customResponses: CustomResponse[];

  @Prop({
    type: MoodMessagingSettingsSchema,
    default: {
      autoRespond: false,
      responseDelay: 2,
      dailyLimit: 100
    }
  })
  settings: MoodMessagingSettings;

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

export type ModelMoodConfigDocument = HydratedDocument<ModelMoodConfig>;

export const ModelMoodConfigSchema = SchemaFactory.createForClass(ModelMoodConfig);

// Ensure performerId is unique
ModelMoodConfigSchema.index({ performerId: 1 }, { unique: true });

// Update the updatedAt timestamp on save
ModelMoodConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
