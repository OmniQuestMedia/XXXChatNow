import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Body,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import {
  DataResponse,
  getConfig
} from 'src/kernel';
import { PerformerDto } from 'src/modules/performer/dtos';
import {
  FileUploadInterceptor, FileUploaded, FileDto
} from 'src/modules/file';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { WatermarkSettingService } from '../services';
import { WatermarkSettingPayload } from '../payloads/watermark-setting.payload';

@Controller('watermark-settings')
export class WatermarkSettingController {
  constructor(
    private readonly watermarkService: WatermarkSettingService
  ) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UseInterceptors(
    FileUploadInterceptor('watermark', 'watermark', {
      destination: getConfig('file').watermarkDir,
      generateThumbnail: true,
      thumbnailSize: getConfig('image').watermarkThumbnail
    })
  )
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @CurrentUser() performer: PerformerDto,
    @Body() payload: WatermarkSettingPayload,
    @FileUploaded() file: FileDto
  ) {
    const data = await this.watermarkService.create(
      performer,
      payload,
      file
    );
    return DataResponse.ok(data);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async getPerformerWatermark(
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<Record<string, any>>> {
    const data = await this.watermarkService.getPerformerWatermark(performer);
    return DataResponse.ok(data);
  }
}
