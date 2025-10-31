import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsIn,
  IsNumber,
  Min
} from 'class-validator';

import { MENU_SECTION } from '../constants';

export class MenuCreatePayload {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([MENU_SECTION.MAIN, MENU_SECTION.HEADER, MENU_SECTION.FOOTER])
  section: string;

  @IsBoolean()
  @IsNotEmpty()
  internal: boolean;

  @IsString()
  @IsOptional()
  parentId: string;

  @IsString()
  @IsOptional()
  help: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  ordering: number;

  @IsBoolean()
  @IsOptional()
  isOpenNewTab: boolean;
}
