import {
  IsString,
  IsIn,
  IsBoolean,
  IsOptional,
  IsNumber
} from 'class-validator';

const STREAM_TYPE = ['public', 'group', 'private'];

export class StreamPayload {
  @IsString()
  @IsOptional()
  @IsIn(STREAM_TYPE)
  type: string;

  @IsString()
  @IsOptional()
  id: string;

  @IsBoolean()
  @IsOptional()
  isStreaming: boolean;

  @IsOptional()
  lastStreamingTime: Date;

  @IsNumber()
  @IsOptional()
  streamingTime: number;

  @IsNumber()
  @IsOptional()
  totalViewer: number;
}
