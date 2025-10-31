import {
  Controller, Get, Param, Put, Query, UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { Roles } from 'src/modules/auth/decorators';
import { DataResponse } from 'src/kernel';
import { FeaturedCreatorBookingStatusSearchPayload } from '../payloads';
import { FeaturedCreatorApprovedService } from '../services';

@Controller('/featured-creator')
export class FeaturedCreatorBookingController {
  constructor(
    private readonly featuredCreatorService: FeaturedCreatorApprovedService
  ) {}

  @Get('/booking-status')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  public async search(@Query() query: FeaturedCreatorBookingStatusSearchPayload) {
    return DataResponse.ok(await this.featuredCreatorService.search(query));
  }

  @Put('/booking-status/update/:id')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  public async cancel(@Param('id') id: string) {
    return DataResponse.ok(await this.featuredCreatorService.cancel(id));
  }

  @Get('/booking/approved/search')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  public async performerSearch(@Query() query: FeaturedCreatorBookingStatusSearchPayload) {
    return DataResponse.ok(await this.featuredCreatorService.userSearch(query));
  }
}
