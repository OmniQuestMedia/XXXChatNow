import {
  IsNotEmpty, IsIn, IsMongoId, IsString
} from 'class-validator';

export class SubscribePerformerPayload {
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  performerId: string;

  @IsNotEmpty()
  @IsIn(['monthly', 'yearly'])
  type: string;
}
