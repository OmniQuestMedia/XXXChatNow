import {
  Controller,
  Injectable,
  UseGuards,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Put,
  Param,
  Delete,
  Get,
  Query
} from '@nestjs/common';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { RoleGuard } from 'src/modules/auth/guards';
import { UserDto } from 'src/modules/user/dtos';
import { DataResponse, PageableData } from 'src/kernel';
import { WheelService, WheelSearchService } from '../services';
import {
  WheelCreatePayload,
  WheelUpdatePayload,
  WheelSearchRequestPayload
} from '../payloads';
import { WheelDto } from '../dtos';

@Injectable()
@Controller('wheels')
export class WheelController {
  constructor(
    private readonly wheelService: WheelService,
    private readonly wheelSearchService: WheelSearchService
  ) { }

  @Post('/')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true
  }))
  async create(
    @Body() payload: WheelCreatePayload,
    @CurrentUser() currentUser: UserDto
  ): Promise<DataResponse<WheelDto>> {
    const wheel = await this.wheelService.create(payload, currentUser);
    return DataResponse.ok(new WheelDto(wheel));
  }

  @Put('/:id')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true
  }))
  async update(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDto,
    @Body() payload: WheelUpdatePayload
  ): Promise<DataResponse<WheelDto>> {
    const wheel = await this.wheelService.update(id, payload, currentUser);
    return DataResponse.ok(new WheelDto(wheel));
  }

  @Delete('/:id')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true
  }))
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDto
  ): Promise<DataResponse<boolean>> {
    const deleted = await this.wheelService.delete(id, currentUser);
    return DataResponse.ok(deleted);
  }

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true
  }))
  async search(
    @Query() req: WheelSearchRequestPayload
  ): Promise<DataResponse<PageableData<WheelDto>>> {
    const wheel = await this.wheelSearchService.search(req);
    return DataResponse.ok(wheel);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({
    transform: true
  }))
  async myList(
    @Query() req: WheelSearchRequestPayload,
    @CurrentUser() performer
  ): Promise<DataResponse<PageableData<WheelDto>>> {
    const wheel = await this.wheelSearchService.search({...req, performerId: performer._id});
    return DataResponse.ok(wheel);
  }

  @Get('/:id/view')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true
  }))
  async details(@Param('id') id: string): Promise<DataResponse<WheelDto>> {
    const wheel = await this.wheelService.findById(id);
    return DataResponse.ok(new WheelDto(wheel));
  }
}
