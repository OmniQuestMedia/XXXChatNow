import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  UseInterceptors,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { DataResponse, getConfig } from 'src/kernel';
import { StudioService } from 'src/modules/studio/services';
import { StudioCreatePayload } from 'src/modules/studio/payloads';
import { FileDto, FileUploaded, FileUploadInterceptor } from 'src/modules/file';
import { STATUS } from 'src/kernel/constants';
import { DocumentMissiongException } from '../exceptions';
import { VerificationService, AuthService } from '../services';

@Controller('auth/studio')
export class StudioRegisterController {
  constructor(
    private readonly studioService: StudioService,
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService
  ) { }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileUploadInterceptor('document-verification', 'documentVerification', {
      destination: getConfig('file').documentDir
    })
  )
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async register(
    @Body() payload: StudioCreatePayload,
    @FileUploaded() file: FileDto
  ): Promise<DataResponse<{ message: string }>> {
    if (file.type !== 'document-verification') {
      throw new DocumentMissiongException();
    }

    const studio = await this.studioService.register(
      {
        ...payload,
        documentVerificationId: file._id,
        emailVerified: false,
        status: STATUS.PENDING
      }
    );

    // create auth, email notification, etc...
    await this.authService.createAuthPassword({
      source: 'studio',
      sourceId: studio._id,
      key: studio.email,
      value: payload.password
    });

    // notify to verify email address
    await this.verificationService.sendVerificationEmail(
      studio._id,
      studio.email,
      'studio'
    );

    return DataResponse.ok({
      message: 'We have sent an email to verify your email, please check your inbox.'
    });
  }
}
