import {
  Body, Controller, HttpCode, HttpStatus, Post, Response
} from '@nestjs/common';
import { AntMediaService } from '../services';

@Controller('streaming')
export class StreamWekhookController {
  constructor(private readonly antMediaService: AntMediaService) { }

  @Post('/antmedia/callback')
  @HttpCode(HttpStatus.OK)
  async antMediaCallback(@Body() data: any, @Response() res: any) {
    await this.antMediaService.callback(data);
    res.setHeader('content-type', 'text/plain');
    res.send('OK');
  }
}
