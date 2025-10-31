import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  Get
} from '@nestjs/common';
import { DataResponse, PageableData } from 'src/kernel';
import { TokenPackageSearchService } from '../services';
import { TokenPackageDto } from '../dtos';
import { TokenPackageSearchPayload } from '../payloads';

@Injectable()
@Controller('package')
export class TokenPackageController {
  constructor(
    private readonly tokenPackageSearchService: TokenPackageSearchService
  ) { }

  @Get('/token/search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(@Query() req: TokenPackageSearchPayload): Promise<DataResponse<PageableData<Partial<TokenPackageDto>>>> {
    const data = await this.tokenPackageSearchService.userSearch(req);
    return DataResponse.ok({
      total: data.total,
      data: data.data.map((p) => new TokenPackageDto(p).toResponse())
    });
  }

  @Get('/featured-creator/search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async searchFeaturedCreator(@Query() req: TokenPackageSearchPayload): Promise<DataResponse<PageableData<Partial<TokenPackageDto>>>> {
    const data = await this.tokenPackageSearchService.userSearch(req);
    return DataResponse.ok({
      total: data.total,
      data: data.data.map((p) => new TokenPackageDto(p).toResponse())
    });
  }
}
