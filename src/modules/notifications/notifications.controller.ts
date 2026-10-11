import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { BroadcastNotificationDto } from './dto/notification.dto.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';

@Controller('notifications')
@UseInterceptors(TenantInterceptor)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private realtime: RealtimeGateway,
  ) {}

  // ---- Public (mobile app) — broadcast inbox ----

  @Get()
  findRecent(@Tenant() tenant: any) {
    return this.notificationsService.findRecent(tenant.id);
  }

  // ---- Admin ----

  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async broadcast(@Tenant() tenant: any, @Body() dto: BroadcastNotificationDto) {
    const notification = await this.notificationsService.create(tenant.id, dto);
    this.realtime.emitNotificationBroadcast(tenant.slug, {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt,
    });
    return notification;
  }
}
