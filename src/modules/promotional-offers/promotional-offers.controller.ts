import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors } from '@nestjs/common';
import { PromotionalOffersService } from './promotional-offers.service.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';

@Controller('promotional-offers')
@UseInterceptors(TenantInterceptor)
export class PromotionalOffersController {
  constructor(private promotionalOffersService: PromotionalOffersService) {}

  @Get()
  async findAll(@Tenant() tenant: any) {
    return this.promotionalOffersService.findAll(tenant.id);
  }

  @Get('active')
  async findActive(@Tenant() tenant: any) {
    return this.promotionalOffersService.findActive(tenant.id);
  }

  @Get(':id')
  async findOne(@Tenant() tenant: any, @Param('id') id: string) {
    return this.promotionalOffersService.findOne(tenant.id, id);
  }

  @Post()
  async create(@Tenant() tenant: any, @Body() data: any) {
    return this.promotionalOffersService.create(tenant.id, data);
  }

  @Put(':id')
  async update(@Tenant() tenant: any, @Param('id') id: string, @Body() data: any) {
    return this.promotionalOffersService.update(tenant.id, id, data);
  }

  @Delete(':id')
  async remove(@Tenant() tenant: any, @Param('id') id: string) {
    return this.promotionalOffersService.remove(tenant.id, id);
  }
}
