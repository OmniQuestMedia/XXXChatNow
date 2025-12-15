import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform, plainToInstance } from 'class-transformer';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { FileDto } from 'src/modules/file';

export class MessageDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.conversationId)
  conversationId: ObjectId;

  @Expose()
  type: string;

  @Expose()
  @Transform(({ obj }) => obj.fileId)
  fileId: ObjectId;

  @Expose()
  text: string;

  @Expose()
  @Transform(({ obj }) => obj.senderId)
  senderId: ObjectId;

  @Expose()
  senderSource: string;

  @Expose()
  @Transform(({ obj }) => obj.meta)
  meta: Record<string, any>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  imageUrl?: string;

  @Expose()
  senderInfo?: any;

  senderRank?: any;

  constructor(data?: Partial<MessageDto>) {
    Object.assign(this, pick(data, [
      '_id', 'conversationId', 'type', 'fileId', 'imageUrl', 'audioUrl', 'isBought',
      'text', 'senderId', 'meta', 'createdAt', 'updatedAt', 'senderInfo', 'senderSource', 'isSale', 'price', 'senderRank'
    ]));
  }

  public static fromModel(model) {
    if (!model) return null;
    return plainToInstance(MessageDto, model.toObject());
  }

  public setSenderInfo(sender: UserDto | PerformerDto) {
    if (!sender) return;
    this.senderInfo = sender.toResponse();
  }

  public setImage(file: FileDto) {
    if (!file) return;
    this.imageUrl = file.getUrl();
  }
}
