import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors, Req } from '@nestjs/common';
import { PromotionalOffersService } from './promotional-offers.service.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { PushService } from '../../common/push/push.service.js';

@Controller('promotional-offers')
@UseInterceptors(TenantInterceptor)
export class PromotionalOffersController {
  constructor(
    private promotionalOffersService: PromotionalOffersService,
    private realtime: RealtimeGateway,
    private push: PushService,
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
    if (offer.isActive) await this.notifyOffer(tenant, offer);
    return offer;
  }

  @Put(':id')
  async update(@Tenant() tenant: any, @Param('id') id: string, @Body() data: any, @Req() req: any) {
    const before = await this.promotionalOffersService
      .findOne(tenant.id, id)
      .catch(() => null);
    const offer = await this.promotionalOffersService.update(tenant.id, id, data);
    this.realtime.emitOfferUpdated(tenant.slug, offer);
    // Notify when switched on, or when details of an already-live offer change
    const becameActive = offer.isActive && before && !before.isActive;
    const detailsChanged =
      offer.isActive &&
      before &&
      before.isActive &&
      (before.name !== offer.name ||
        before.description !== offer.description ||
        String(before.discountAmount) !== String(offer.discountAmount) ||
        Number(before.discountPercent) !== Number(offer.discountPercent) ||
        Number(before.buyQuantity) !== Number(offer.buyQuantity) ||
        Number(before.getQuantity) !== Number(offer.getQuantity));
    if (becameActive || detailsChanged) await this.notifyOffer(tenant, offer);
    return offer;
  }

  /** Push + inbox broadcast for a newly-live offer. */
  private async notifyOffer(tenant: any, offer: any) {
    const body = offer.description
      ? `${offer.name} — ${offer.description}`
      : offer.name;
    this.realtime.emitNotificationBroadcast(tenant.slug, {
      id: `${Date.now()}`,
      title: 'New offer',
      body,
      createdAt: new Date(),
    });
    await this.push.sendToCustomers(tenant.id, 'New offer', body);
  }

  @Delete(':id')
  async remove(@Tenant() tenant: any, @Param('id') id: string, @Req() req: any) {
    await this.promotionalOffersService.remove(tenant.id, id);
    this.realtime.emitOfferDeleted(tenant.slug, id);
    return { success: true };
  }
}
