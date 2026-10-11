import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Firebase Cloud Messaging sender + device token registry.
 *
 * Configure by setting FCM_SERVICE_ACCOUNT_JSON in the environment to the
 * raw service-account JSON (or base64-encoded JSON). If unset, pushes are
 * silently skipped so the rest of the API still works.
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private ready = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const creds = process.env.FCM_SERVICE_ACCOUNT_JSON;
    if (!creds) {
      this.logger.warn('FCM_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
      return;
    }
    try {
      const json = Buffer.from(creds, 'base64').toString('utf8');
      const parsed = JSON.parse(creds.startsWith('{') ? creds : json);
      if (getApps().length === 0) {
        initializeApp({ credential: cert(parsed) });
      }
      this.ready = true;
      this.logger.log('Firebase initialized — push notifications enabled');
    } catch (e) {
      this.logger.error(`Firebase init failed: ${e}`);
    }
  }

  /** Register/refresh a device token for a customer or a portal user. */
  async registerToken(
    tenantId: string,
    token: string,
    platform: string | undefined,
    owner: { customerId?: string; userId?: string },
  ) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: {
        tenantId,
        customerId: owner.customerId ?? null,
        userId: owner.userId ?? null,
        platform: platform ?? null,
      },
      create: {
        tenantId,
        token,
        platform: platform ?? null,
        customerId: owner.customerId ?? null,
        userId: owner.userId ?? null,
      },
    });
  }

  /** Push to every customer device in the tenant (broadcast announcements). */
  async sendToCustomers(tenantId: string, title: string, body: string) {
    const rows = await this.prisma.deviceToken.findMany({
      where: { tenantId, customerId: { not: null } },
      select: { token: true },
    });
    await this.send(rows.map((r) => r.token), title, body, 'announcements');
  }

  /** Push to every portal/salesman device in the tenant (new orders etc). */
  async sendToUsers(tenantId: string, title: string, body: string) {
    const rows = await this.prisma.deviceToken.findMany({
      where: { tenantId, userId: { not: null } },
      select: { token: true },
    });
    await this.send(rows.map((r) => r.token), title, body, 'orders');
  }

  private async send(
    tokens: string[],
    title: string,
    body: string,
    channelId: string,
  ) {
    if (!this.ready || tokens.length === 0) return;

    const res = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { title, body },
      android: {
        priority: 'high',
        notification: { channelId, sound: 'default' },
      },
    });

    // Drop dead tokens so the table stays clean
    const dead = res.responses
      .map((r, i) => ({ r, token: tokens[i] }))
      .filter(
        ({ r }) =>
          !r.success &&
          /registration-token-not-registered|invalid-registration/.test(
            r.error?.code ?? '',
          ),
      )
      .map(({ token }) => token);
    if (dead.length) {
      await this.prisma.deviceToken.deleteMany({ where: { token: { in: dead } } });
    }
    this.logger.log(`Push sent: ${res.successCount} ok, ${res.failureCount} failed`);
  }
}
