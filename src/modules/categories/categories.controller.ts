import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';

@Controller('categories')
@UseInterceptors(TenantInterceptor)
export class CategoriesController {
  constructor(
    private categoriesService: CategoriesService,
    private realtime: RealtimeGateway,
  ) {}

  @Get()
  async findAll(@Tenant() tenant: any, @Query() query: any) {
    return this.categoriesService.findAll(tenant.id, query);
  }

  @Get(':id')
  async findOne(@Tenant() tenant: any, @Param('id') id: string) {
    return this.categoriesService.findOne(tenant.id, id);
  }

  @Post()
  async create(@Tenant() tenant: any, @Body() data: any, @Req() req: any) {
    const category = await this.categoriesService.create(tenant.id, data);
    this.realtime.emitCategoryCreated(tenant.slug, category);
    return category;
  }

  @Put(':id')
  async update(@Tenant() tenant: any, @Param('id') id: string, @Body() data: any, @Req() req: any) {
    const category = await this.categoriesService.update(tenant.id, id, data);
    this.realtime.emitCategoryUpdated(tenant.slug, category);
    return category;
  }

  @Delete(':id')
  async remove(@Tenant() tenant: any, @Param('id') id: string, @Req() req: any) {
    await this.categoriesService.remove(tenant.id, id);
    this.realtime.emitCategoryDeleted(tenant.slug, id);
    return { success: true };
  }
}
