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

  // Broadcasts are ephemeral — nothing is stored, so the inbox is
  // always empty on (re)start. Notifications only live in the app's
  // session state / OS tray.
  @Get()
  findRecent() {
    return [];
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
    // No persistence — push + realtime only
    this.realtime.emitNotificationBroadcast(tenant.slug, {
      id: `${Date.now()}`,
      title: dto.title,
      body: dto.body,
      createdAt: new Date(),
    });
    // Reach killed/background apps via FCM
    await this.push.sendToCustomers(tenant.id, dto.title, dto.body);
    return { sent: true };
  }
}
