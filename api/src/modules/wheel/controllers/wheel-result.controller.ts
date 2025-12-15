import {
  Controller,
  Injectable,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Put,
  Param
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { UserDto } from 'src/modules/user/dtos';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { WheelResultService } from '../services';
import { WheelDto } from '../dtos';

@Injectable()
@Controller('wheel-result')
export class WheelResultController {
  constructor(
    private readonly wheelResultService: WheelResultService
  ) { }

  @Put('/status/:id')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true
  }))
  async update(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDto,
    @Body() payload: {status: string}
  ): Promise<DataResponse<WheelDto>> {
    const wheel = await this.wheelResultService.updateStatus(id, payload, currentUser);
    return DataResponse.ok(new WheelDto(wheel));
  }
}
