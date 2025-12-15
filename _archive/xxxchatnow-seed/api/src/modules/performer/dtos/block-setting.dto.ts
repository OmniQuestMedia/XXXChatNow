import { ObjectId } from 'mongodb';
import { Expose, Transform } from 'class-transformer';
import { UserDto } from 'src/modules/user/dtos';

export class BlockSettingDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.countries)
  countries: string[];

  @Expose()
  @Transform(({ obj }) => obj.userIds)
  userIds: ObjectId[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // additional info
  @Expose()
  usersInfo: Partial<UserDto>[];
}
