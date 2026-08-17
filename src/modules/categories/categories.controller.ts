import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';

@Controller('categories')
@UseInterceptors(TenantInterceptor)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Tenant() tenant: any, @Query() query: any) {
    return this.categoriesService.findAll(tenant.id, query);
  }

  @Get(':id')
  async findOne(@Tenant() tenant: any, @Param('id') id: string) {
    return this.categoriesService.findOne(tenant.id, id);
  }

  @Post()
  async create(@Tenant() tenant: any, @Body() data: any) {
    return this.categoriesService.create(tenant.id, data);
  }

  @Put(':id')
  async update(@Tenant() tenant: any, @Param('id') id: string, @Body() data: any) {
    return this.categoriesService.update(tenant.id, id, data);
  }

  @Delete(':id')
  async remove(@Tenant() tenant: any, @Param('id') id: string) {
    return this.categoriesService.remove(tenant.id, id);
  }
}
