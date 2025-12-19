import { Roles } from 'src/modules/auth/decorators';
import {
  Controller, Get, HttpCode, HttpStatus, Injectable, Query, UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { FeaturedCreatorPackageSearchService } from '../services';
import { FeaturedCreatorPackageDto, IFeaturedCreatorPackage } from '../dtos';
import { FeaturedCreatorPackageSearchPayload } from '../payloads';

@Injectable()
@Controller('performer-package')
export class FeaturedCreatorPackageController {
  constructor(
    private readonly featuredCreatorPackageSearchService: FeaturedCreatorPackageSearchService
  ) {}

  @Get('/featured-creator/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getFeaturedCreatorPackages(
    @Query() req: FeaturedCreatorPackageSearchPayload
  ): Promise<DataResponse<PageableData<IFeaturedCreatorPackage>>> {
    const data = await this.featuredCreatorPackageSearchService.performerSearch(req);

    return DataResponse.ok({
      total: data.total,
      data: data.data.map((p) => new FeaturedCreatorPackageDto(p).toResponse())
    });
  }
}
