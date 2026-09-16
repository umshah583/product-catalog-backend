import { Controller, Get, Put, Body, UseInterceptors, Req } from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';

@Controller('settings')
@UseInterceptors(TenantInterceptor)
export class SettingsController {
  constructor(
    private settingsService: SettingsService,
    private realtime: RealtimeGateway,
  ) {}

  @Get()
  async findByTenant(@Tenant() tenant: any) {
    return this.settingsService.findByTenant(tenant.id);
  }

  @Put()
  async update(@Tenant() tenant: any, @Body() data: any, @Req() req: any) {
    const settings = await this.settingsService.update(tenant.id, data);
    this.realtime.emitSettingsUpdated(tenant.slug, settings);
    return settings;
  }
}
