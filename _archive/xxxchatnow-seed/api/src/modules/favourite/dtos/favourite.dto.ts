import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { PerformerDto } from 'src/modules/performer/dtos';
import { Expose, Transform } from 'class-transformer';
import { UserDto } from 'src/modules/user/dtos';

export class FavouriteDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.favoriteId)
  favoriteId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.ownerId)
  ownerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performer)
  performer: Partial<PerformerDto>;

  @Expose()
  @Transform(({ obj }) => obj.user)
  user: Partial<UserDto>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(data: Partial<FavouriteDto>) {
    Object.assign(
      this,
      pick(data, [
        'favoriteId',
        'ownerId',
        'performer',
        'user',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  public setPerformer(performerInfo: PerformerDto) {
    if (!performerInfo) return;
    this.performer = performerInfo.toSearchResponse();
  }

  public setUser(user: UserDto) {
    if (!user) return;
    this.user = user.toSearchResponse();
  }
}
