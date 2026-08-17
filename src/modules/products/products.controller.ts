import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';

@Controller('products')
@UseInterceptors(TenantInterceptor)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async findAll(@Tenant() tenant: any, @Query() query: any) {
    return this.productsService.findAll(tenant.id, query);
  }

  @Get('featured')
  async findFeatured(@Tenant() tenant: any) {
    return this.productsService.findFeatured(tenant.id);
  }

  @Get('category/:categoryId')
  async findByCategory(@Tenant() tenant: any, @Param('categoryId') categoryId: string) {
    return this.productsService.findByCategory(tenant.id, categoryId);
  }

  @Get(':id')
  async findOne(@Tenant() tenant: any, @Param('id') id: string) {
    return this.productsService.findOne(tenant.id, id);
  }

  @Post()
  async create(@Tenant() tenant: any, @Body() data: any) {
    return this.productsService.create(tenant.id, data);
  }

  @Put(':id')
  async update(@Tenant() tenant: any, @Param('id') id: string, @Body() data: any) {
    return this.productsService.update(tenant.id, id, data);
  }

  @Delete(':id')
  async remove(@Tenant() tenant: any, @Param('id') id: string) {
    return this.productsService.remove(tenant.id, id);
  }
}
