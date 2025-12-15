import {
  IsString, IsNotEmpty, IsIn, IsMongoId
} from 'class-validator';

export class ConversationCreatePayload {
  @IsNotEmpty()
  @IsString()
  type = 'private';

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  sourceId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['user', 'performer'])
  source: string;
}
