import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, Req } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { PushService } from '../../common/push/push.service.js';

@Controller('products')
@UseInterceptors(TenantInterceptor)
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private realtime: RealtimeGateway,
    private push: PushService,
  ) {}

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
  async create(@Tenant() tenant: any, @Body() data: any, @Req() req: any) {
    const product = await this.productsService.create(tenant.id, data);
    this.realtime.emitProductCreated(tenant.slug, product);
    return product;
  }

  @Put(':id')
  async update(@Tenant() tenant: any, @Param('id') id: string, @Body() data: any, @Req() req: any) {
    const before = await this.productsService.findOne(tenant.id, id).catch(() => null);
    const product = await this.productsService.update(tenant.id, id, data);
    this.realtime.emitProductUpdated(tenant.slug, product);

    // Price change → notify all customer installs
    if (before) {
      const baseChanged = Number(before.price) !== Number(product.price);
      const tiersChanged =
        JSON.stringify(before.priceTiers) !== JSON.stringify(product.priceTiers);
      if (baseChanged || tiersChanged) {
        const cur = await this.push.tenantCurrency(tenant.id);
        const base = `${cur} ${Number(product.price).toFixed(2)}`;
        // Cheapest bulk rate — headline for tier-only changes
        const tiers = Array.isArray(product.priceTiers)
          ? (product.priceTiers as any[])
          : [];
        const bestTier = tiers.length
          ? tiers.reduce((a, b) =>
              Number(a.price ?? Infinity) <= Number(b.price ?? Infinity)
                ? a
                : b,
            )
          : null;
        const tierPrice = bestTier ? Number(bestTier.price) : null;
        const tierQty = bestTier?.minQty ? Number(bestTier.minQty) : null;
        const body = tiersChanged
          ? tierPrice && tierPrice < Number(product.price)
            ? `${product.name} — ${base}, ${cur} ${tierPrice.toFixed(2)} each for ${tierQty}+ pcs`
            : `${product.name} — bulk pricing updated`
          : `${product.name} is now ${base}`;
        this.realtime.emitNotificationBroadcast(tenant.slug, {
          id: `${Date.now()}`,
          title: 'Price update',
          body,
          createdAt: new Date(),
        });
        await this.push.sendToCustomers(tenant.id, 'Price update', body);
      }
    }
    return product;
  }

  @Delete(':id')
  async remove(@Tenant() tenant: any, @Param('id') id: string, @Req() req: any) {
    await this.productsService.remove(tenant.id, id);
    this.realtime.emitProductDeleted(tenant.slug, id);
    return { success: true };
  }
}
