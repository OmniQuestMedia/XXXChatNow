import {
  Controller,
  Put,
  Post,
  Body,
  Delete,
  HttpCode,
  UseGuards,
  UsePipes,
  HttpStatus,
  ValidationPipe,
  Get,
  Query,
  Param,
  UseInterceptors,
  Request,
  HttpException
} from '@nestjs/common';
import { Request as Req } from 'express';
import {
  DataResponse,
  EntityNotFoundException,
  getConfig,
  QueueEvent,
  QueueEventService
} from 'src/kernel';
import { AuthService, VerificationService } from 'src/modules/auth/services';
import { DocumentMissiongException } from 'src/modules/auth/exceptions';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { RoleGuard } from 'src/modules/auth/guards';
import { FileDto, FileUploaded, FileUploadInterceptor } from 'src/modules/file';
import {
  DELETE_FILE_TYPE,
  FileService,
  FILE_EVENT,
  MEDIA_FILE_CHANNEL
} from 'src/modules/file/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import {
  PerformerCreatePayload,
  PerformerSearchPayload
} from 'src/modules/performer/payloads';
import {
  PerformerCommissionService,
  PerformerSearchService,
  PerformerService
} from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { omit } from 'lodash';
import { EVENT, EXCLUDE_FIELDS } from 'src/kernel/constants';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { STUDIO_STATUES } from '../constants';
import { StudioDto } from '../dtos';
import {
  StudioUpdatePayload,
  StudioSearchPayload,
  UpdateCommissionPayload,
  StudioCreateByAdminPayload
} from '../payloads';
import { StudioService } from '../services';

@Controller('studio')
export class StudioController {
  constructor(
    private readonly studioService: StudioService,
    private readonly performerService: PerformerService,
    private readonly performerSearchService: PerformerSearchService,
    private readonly performerCommissionService: PerformerCommissionService,
    private readonly queueEventService: QueueEventService,
    private readonly authService: AuthService,
    private readonly fileService: FileService,
    private readonly verificationService: VerificationService
  ) { }

  @Get('/me')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  async me(@Request() request: Req): Promise<DataResponse<Partial<StudioDto>>> {
    const jwtToken = request.headers.authorization;
    const studio = await this.authService.getSourceFromJWT(jwtToken);
    if (!studio || studio.status !== STUDIO_STATUES.ACTIVE) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.studioService.getMe(studio._id, jwtToken);
    return DataResponse.ok(result);
  }

  @Get('/:id/view')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async detail(
    @Param('id') id: string,
    @Request() request: Req
  ): Promise<DataResponse<Partial<StudioDto>>> {
    const jwtToken = request.headers.authorization;
    const result = await this.studioService.detail(id, jwtToken);
    return DataResponse.ok(result);
  }

  @Put('/update')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Body() payload: StudioUpdatePayload,
    @CurrentUser() currentStudio: StudioDto
  ) {
    await this.studioService.update(
      currentStudio._id,
      omit(payload, EXCLUDE_FIELDS)
    );
    const studio = await this.studioService.findById(currentStudio._id);
    if (payload.documentVerificationId) {
      await this.fileService.addRef(payload.documentVerificationId, {
        itemId: studio._id,
        itemType: 'studio-document'
      });
    }

    return DataResponse.ok(new StudioDto(studio).toResponse(true));
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(@Query() query: StudioSearchPayload) {
    const result = await this.studioService.search(query);
    return DataResponse.ok(result);
  }

  @Get('members')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async members(
    @Query() query: PerformerSearchPayload,
    @CurrentUser() user: UserDto
  ) {
    const result = await this.performerSearchService.search(
      { ...query, studioId: user._id.toString() },
      user
    );
    return DataResponse.ok(result);
  }

  @Post('/register')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  async register(@Body() payload: StudioCreateByAdminPayload) {
    const studio = await this.studioService.register(payload);
    await this.authService.createAuthPassword({
      source: 'studio',
      sourceId: studio._id,
      key: studio.email,
      value: payload.password
    });

    return DataResponse.ok(studio);
  }

  @Put('/documents/upload')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor(
      'company-registration-certificate',
      'documentVerification',
      {
        destination: getConfig('file').documentDir
      }
    )
  )
  async updateDocumentVerification(
    @FileUploaded() file: FileDto,
    @CurrentUser() studio: StudioDto,
    @Request() request: Req
  ) {
    if (file.type !== 'company-registration-certificate') {
      throw new DocumentMissiongException();
    }

    await this.studioService.uploadDocument(studio, file._id);
    await this.fileService.addRef(file._id, {
      itemId: studio._id,
      itemType: 'studio-document'
    });
    await this.queueEventService.publish({
      channel: MEDIA_FILE_CHANNEL,
      eventName: FILE_EVENT.FILE_RELATED_MODULE_UPDATED,
      data: {
        type: DELETE_FILE_TYPE.FILEID,
        currentFile: studio.documentVerificationId,
        newFile: file._id
      }
    });
    const jwtToken = request.headers.authorization;
    return DataResponse.ok({
      file,
      url: jwtToken
        ? `${FileDto.getPublicUrl(file.path)}?documentId=${file._id
        }&token=${jwtToken}`
        : FileDto.getPublicUrl(file.path)
    });
  }

  @Post('/documents/upload')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'studio')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor(
      'company-registration-certificate',
      'documentVerification',
      {
        destination: getConfig('file').documentDir
      }
    )
  )
  async uploadDocumentVerification(
    @FileUploaded() file: FileDto,
    @Request() request: Req,
    @CurrentUser() studio: StudioDto
  ) {
    if (file.type !== 'company-registration-certificate') {
      throw new DocumentMissiongException();
    }

    await this.fileService.addRef(file._id, {
      itemId: studio._id,
      itemType: 'studio-document'
    });

    const jwtToken = request.headers.authorization;
    return DataResponse.ok({
      file,
      url: jwtToken
        ? `${FileDto.getPublicUrl(file.path)}?documentId=${file._id
        }&token=${jwtToken}`
        : FileDto.getPublicUrl(file.path)
    });
  }

  @Put('/:id/documents/upload')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor(
      'company-registration-certificate',
      'documentVerification',
      {
        destination: getConfig('file').documentDir
      }
    )
  )
  async adminUpdateDocumentVerification(
    @FileUploaded() file: FileDto,
    @Param('id') id: string,
    @Request() request: Req
  ) {
    if (file.type !== 'company-registration-certificate') {
      throw new DocumentMissiongException();
    }

    const studio = await this.studioService.findById(id);
    if (!studio) {
      throw new EntityNotFoundException();
    }

    await this.studioService.uploadDocument(studio, file._id);
    await this.fileService.addRef(file._id, {
      itemId: studio._id,
      itemType: 'studio-document'
    });
    await this.queueEventService.publish({
      channel: MEDIA_FILE_CHANNEL,
      eventName: FILE_EVENT.FILE_RELATED_MODULE_UPDATED,
      data: {
        type: DELETE_FILE_TYPE.FILEID,
        currentFile: studio.documentVerificationId,
        newFile: file._id
      }
    });
    const jwtToken = request.headers.authorization;
    return DataResponse.ok({
      file,
      url: jwtToken
        ? `${FileDto.getPublicUrl(file.path)}?documentId=${file._id
        }&token=${jwtToken}`
        : FileDto.getPublicUrl(file.path)
    });
  }

  @Put('/:id/update')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async adminUpdate(
    @Body() payload: StudioUpdatePayload,
    @Param('id') id: string
  ) {
    await this.studioService.update(id, payload);
    const studio = await this.studioService.findById(id);
    if (payload.documentVerificationId) {
      await this.fileService.addRef(payload.documentVerificationId, {
        itemId: studio._id,
        itemType: 'studio-document'
      });
    }

    return DataResponse.ok(new StudioDto(studio).toResponse(true));
  }

  @Post('members')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async addMember(
    @Body() payload: PerformerCreatePayload,
    @CurrentUser() currentStudio: StudioDto
  ) {
    const performer = await this.performerService.create({
      ...payload,
      studioId: currentStudio._id
    });

    if (payload.password) {
      await this.authService.createAuthPassword({
        source: 'performer',
        sourceId: performer._id,
        key: performer.email.toLowerCase().trim(),
        value: payload.password
      });
    }

    const event: QueueEvent = {
      channel: 'STUDIO_MEMBER_CHANNEL',
      eventName: EVENT.CREATED,
      data: { studioId: currentStudio._id }
    };
    await this.queueEventService.publish(event);
    await this.verificationService.sendVerificationEmail(
      performer._id,
      performer.email,
      'performer',
      {
        template: 'model-create-by-studio-email-verification',
        data: {
          studio: currentStudio
        }
      }
    );
    return DataResponse.ok(new PerformerDto(performer).toResponse());
  }

  @Delete('/members/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async removeMember(
    @Param('id') id: string,
    @CurrentUser() currentStudio: StudioDto
  ) {
    await this.performerService.removeStudioId(id, currentStudio._id);
    return DataResponse.ok(true);
  }

  @Post('members/:id/:status')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateMemberStatus(
    @Param('id') id: string,
    @Param('status') status: string,
    @CurrentUser() currentStudio: StudioDto
  ) {
    await this.performerService.studioUpdateStatus(id, status, currentStudio._id);
    const performer = await this.performerService.findById(id);
    return DataResponse.ok(new PerformerDto(performer).toResponse());
  }

  @Post('members/:id/commission')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateMemberCommission(
    @Param('id') id: string,
    @Body() payload: UpdateCommissionPayload,
    @CurrentUser() currentStudio: StudioDto
  ) {
    await this.performerCommissionService.studioUpdate(
      id,
      payload,
      currentStudio._id
    );
    const commission = await this.performerCommissionService.findOne({
      performerId: id
    });
    return DataResponse.ok(commission);
  }

  @Get('/stats')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  async stats(@CurrentUser() studio: StudioDto) {
    const results = await this.studioService.stats(studio._id);
    return DataResponse.ok(results);
  }

  @Get('/commission-setting')
  @HttpCode(HttpStatus.OK)
  @Roles('studio')
  @UseGuards(RoleGuard)
  async getDefaultCommission(@CurrentUser() studio: StudioDto) {
    const defaultCommission = SettingService.getValueByKey(SETTING_KEYS.STUDIO_COMMISSION);
    return DataResponse.ok(
      typeof studio.commission === 'number'
        ? studio.commission
        : defaultCommission
    );
  }
}
