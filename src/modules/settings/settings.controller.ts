import { Controller, Get, Put, Body, UseInterceptors } from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';

@Controller('settings')
@UseInterceptors(TenantInterceptor)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async findByTenant(@Tenant() tenant: any) {
    return this.settingsService.findByTenant(tenant.id);
  }

  @Put()
  async update(@Tenant() tenant: any, @Body() data: any) {
    return this.settingsService.update(tenant.id, data);
  }
}
