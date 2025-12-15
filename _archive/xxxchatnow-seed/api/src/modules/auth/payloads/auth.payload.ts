import {
  IsMongoId, IsNotEmpty, IsOptional, IsString
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { ObjectId as MongooseObjectId } from 'mongoose';

export class AuthPayload {
  @IsString()
  @IsOptional()
  source = 'user';

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  sourceId: ObjectId | MongooseObjectId | string | any;

  @IsString()
  @IsOptional()
  type? = 'password';

  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  value?: string;
}
