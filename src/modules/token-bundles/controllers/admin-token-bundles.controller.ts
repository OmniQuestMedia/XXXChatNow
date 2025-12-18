import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TokenBundlesService } from '../token-bundles.service';
import { CreateTokenBundleDto } from '../dto/create-token-bundle.dto';
import { UpdateTokenBundleDto } from '../dto/update-token-bundle.dto';

@Controller('admin/token-bundles')
export class AdminTokenBundlesController {
  constructor(private readonly tokenBundlesService: TokenBundlesService) {}

  @Post()
  create(@Body() createTokenBundleDto: CreateTokenBundleDto) {
    return this.tokenBundlesService.create(createTokenBundleDto);
  }

  @Get()
  findAll() {
    return this.tokenBundlesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tokenBundlesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTokenBundleDto: UpdateTokenBundleDto) {
    return this.tokenBundlesService.update(id, updateTokenBundleDto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.tokenBundlesService.deactivate(id);
  }

  @Post('seed')
  seedDefaults() {
    return this.tokenBundlesService.seedDefaultBundles();
  }
}
