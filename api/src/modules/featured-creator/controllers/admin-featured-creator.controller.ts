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
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { Roles } from 'src/modules/auth/decorators';
import { FeaturedCreatorPackageService, FeaturedCreatorPackageSearchService } from '../services';
import {
  FeaturedCreatorBookingUpdatePayload,
  FeaturedCreatorPackageCreatePayload,
  FeaturedCreatorPackageUpdatePayload
} from '../payloads';
import {
  IFeaturedCreatorPackage, FeaturedCreatorPackageDto, IFeaturedCreatorBooking, FeaturedCreatorBookingDto
} from '../dtos';

@Injectable()
@Controller('admin/package')
export class AdminFeaturedPackageController {
  constructor(
    private readonly featuredCreatorPackageService: FeaturedCreatorPackageService,
    private readonly featuredPackageSearchService: FeaturedCreatorPackageSearchService
  ) {}

  @Post('/featured-creator')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() payload: FeaturedCreatorPackageCreatePayload
  ): Promise<DataResponse<IFeaturedCreatorPackage>> {
    const featuredPackage = await this.featuredCreatorPackageService.create(payload);
    return DataResponse.ok(new FeaturedCreatorPackageDto(featuredPackage).toResponse());
  }

  @Get('/featured-creator')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async adminSearch(
    @Query() req: any
  ): Promise<DataResponse<PageableData<IFeaturedCreatorPackage>>> {
    const data = await this.featuredPackageSearchService.search(req);
    return DataResponse.ok({
      total: data.total,
      data: data.data.map((p) => new FeaturedCreatorPackageDto(p).toResponse())
    });
  }

  @Get('/featured-creator/view/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async details(@Param('id') id: string): Promise<DataResponse<IFeaturedCreatorPackage>> {
    const featuredPackage = await this.featuredCreatorPackageService.findById(id);
    return DataResponse.ok(new FeaturedCreatorPackageDto(featuredPackage).toResponse());
  }

  @Put('/featured-creator/update/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Body() payload: FeaturedCreatorPackageUpdatePayload,
    @Param('id') id: string
  ): Promise<any> {
    const resp = await this.featuredCreatorPackageService.update(id, payload);
    return DataResponse.ok(resp);
  }

  @Delete('/featured-creator/delete/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async delete(@Param('id') id: string): Promise<DataResponse<boolean>> {
    await this.featuredCreatorPackageService.delete(id);
    return DataResponse.ok(true);
  }

  @Get('/featured-creator/booking')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async featuredCreatorBooking(
    @Query() req: any
  ): Promise<DataResponse<PageableData<IFeaturedCreatorBooking>>> {
    const data = await this.featuredCreatorPackageService.searchBooking(req);
    return DataResponse.ok({
      total: data.total,
      data: data.data.map((p) => new FeaturedCreatorBookingDto(p).toResponse())
    });
  }

  @Get('/featured-creator/booking/view/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async getBookingById(@Param('id') id: string): Promise<DataResponse<IFeaturedCreatorBooking>> {
    const featuredPackage = await this.featuredCreatorPackageService.getBookingById(id);
    return DataResponse.ok(new FeaturedCreatorBookingDto(featuredPackage).toResponse());
  }

  @Put('/featured-creator/booking/update/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async featuredCreatorBookingUpdate(
    @Body() payload: FeaturedCreatorBookingUpdatePayload,
    @Param('id') id: string
  ): Promise<any> {
    const resp = await this.featuredCreatorPackageService.updateBooking(id, payload);
    return DataResponse.ok(resp);
  }
}
