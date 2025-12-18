import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PolicyService } from '../policy.service';
import { CreatePolicyDto } from '../dto/create-policy.dto';
import { UpdatePolicyDto } from '../dto/update-policy.dto';

@Controller('admin/policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get()
  async findAll(@Query('category') category?: string) {
    if (category) {
      return this.policyService.findByCategory(category);
    }
    return this.policyService.findAll();
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    return this.policyService.findOne(key);
  }

  @Post()
  async create(@Body() createPolicyDto: CreatePolicyDto) {
    // TODO: Get user from request context
    const modifiedBy = 'system'; // Placeholder
    return this.policyService.create(createPolicyDto, modifiedBy);
  }

  @Put(':key')
  async update(@Param('key') key: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    // TODO: Get user from request context
    const modifiedBy = 'system'; // Placeholder
    return this.policyService.update(key, updatePolicyDto, modifiedBy);
  }

  @Post('validate')
  async validate(@Body() body: { key: string; value: any }) {
    return this.policyService.validate(body.key, body.value);
  }

  @Get(':key/history')
  async getHistory(@Param('key') key: string) {
    return this.policyService.getHistory(key);
  }
}
