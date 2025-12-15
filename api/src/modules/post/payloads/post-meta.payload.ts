import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class PostMetaPayload {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsOptional()
  value: any;
}
