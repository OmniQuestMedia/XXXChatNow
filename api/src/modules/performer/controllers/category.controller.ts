import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  Query,
  Param
} from '@nestjs/common';
import { DataResponse, EntityNotFoundException, PageableData } from 'src/kernel';
import { CategorySearchService, CategoryService } from '../services';
import { CategorySearchRequestPayload } from '../payloads';
import { PerformerCategoryDto } from '../dtos';

@Injectable()
@Controller('performer-categories')
export class CategoryController {
  constructor(
    private readonly categorySearchService: CategorySearchService,
    private readonly categoryService: CategoryService
  ) { }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getList(
    @Query() req: CategorySearchRequestPayload
  ): Promise<DataResponse<PageableData<PerformerCategoryDto>>> {
    const query = {
      ...req,
      limit: 999,
      sort: 'asc',
      sortBy: 'ordering'
    } as any;
    const list = await this.categorySearchService.search(query);
    return DataResponse.ok(list);
  }

  @Get('/:id/view')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async details(
    @Param('id') id: string
  ): Promise<DataResponse<PerformerCategoryDto>> {
    const category = await this.categoryService.findByIdOrSlug(id);
    if (!category) {
      throw new EntityNotFoundException();
    }

    return DataResponse.ok(new PerformerCategoryDto(category));
  }
}
