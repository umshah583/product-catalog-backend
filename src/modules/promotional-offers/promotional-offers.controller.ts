import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors, Req } from '@nestjs/common';
import { PromotionalOffersService } from './promotional-offers.service.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';

@Controller('promotional-offers')
@UseInterceptors(TenantInterceptor)
export class PromotionalOffersController {
  constructor(
    private promotionalOffersService: PromotionalOffersService,
    private realtime: RealtimeGateway,
  ) {}

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
  async create(@Tenant() tenant: any, @Body() data: any, @Req() req: any) {
    const offer = await this.promotionalOffersService.create(tenant.id, data);
    this.realtime.emitOfferCreated(tenant.slug, offer);
    return offer;
  }

  @Put(':id')
  async update(@Tenant() tenant: any, @Param('id') id: string, @Body() data: any, @Req() req: any) {
    const offer = await this.promotionalOffersService.update(tenant.id, id, data);
    this.realtime.emitOfferUpdated(tenant.slug, offer);
    return offer;
  }

  @Delete(':id')
  async remove(@Tenant() tenant: any, @Param('id') id: string, @Req() req: any) {
    await this.promotionalOffersService.remove(tenant.id, id);
    this.realtime.emitOfferDeleted(tenant.slug, id);
    return { success: true };
  }
}
