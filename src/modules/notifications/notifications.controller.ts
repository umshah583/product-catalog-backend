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
import { PushService } from '../../common/push/push.service.js';

@Controller('notifications')
@UseInterceptors(TenantInterceptor)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private realtime: RealtimeGateway,
    private push: PushService,
  ) {}

  // ---- Public (mobile app) — broadcast inbox ----

  @Get()
  findRecent(@Tenant() tenant: any) {
    return this.notificationsService.findRecent(tenant.id);
  }

  /**
   * Register a device for broadcasts — public so push reaches every
   * install, even before the customer logs in.
   */
  @Post('device-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deviceToken(
    @Tenant() tenant: any,
    @Body() body: { token: string; platform?: string },
  ) {
    await this.push.registerToken(tenant.id, body.token, body.platform, {});
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
    // Reach killed/background apps via FCM
    await this.push.sendToCustomers(
      tenant.id,
      notification.title,
      notification.body,
    );
    return notification;
  }
}
