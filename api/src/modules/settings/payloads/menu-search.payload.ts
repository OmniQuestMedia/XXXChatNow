import { SearchRequest } from 'src/kernel/common';
import {
  IsString, IsOptional, IsIn, IsBoolean
} from 'class-validator';

import { MENU_SECTION } from '../constants';

export class MenuSearchRequestPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  title: string;

  @IsBoolean()
  @IsOptional()
  public: boolean;

  @IsBoolean()
  @IsOptional()
  internal: boolean;

  @IsString()
  @IsIn([MENU_SECTION.MAIN, MENU_SECTION.HEADER, MENU_SECTION.FOOTER])
  @IsOptional()
  section: string;
}
