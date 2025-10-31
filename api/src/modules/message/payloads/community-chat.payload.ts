import { IsNotEmpty, IsString } from 'class-validator';

export class CommunityChatPayload {
  @IsNotEmpty()
  @IsString()
  name: string;
}
