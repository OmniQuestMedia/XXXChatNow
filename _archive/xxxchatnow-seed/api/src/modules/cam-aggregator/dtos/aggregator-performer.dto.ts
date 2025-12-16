import { ObjectId } from 'mongodb';
import { Expose, Transform } from 'class-transformer';

export class AggregatorPerformerDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  service: string;

  @Expose()
  servicePerformerId: string;

  @Expose()
  gender: string;

  @Expose()
  avatar: string;

  @Expose()
  username: string;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  age: number;

  @Expose()
  isOnline: boolean;

  @Expose()
  isStreaming: boolean;

  @Expose()
  watching: number;

  @Expose()
  @Transform(({ obj }) => obj.stats || { views: 0, favorites: 0 })
  stats: {
    views: number;
    favorites: number;
  };

  @Expose()
  streamingStatus: string;

  @Expose()
  country: string;

  @Expose()
  countryFlag: string;

  @Expose()
  city: string;

  @Expose()
  @Transform(({ obj }) => obj.languages || [])
  languages: string[];

  @Expose()
  aboutMe: string;

  @Expose()
  @Transform(({ obj }) => obj.tags || [])
  tags: string[];

  @Expose()
  iframe: string;

  @Expose()
  profileLink: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
