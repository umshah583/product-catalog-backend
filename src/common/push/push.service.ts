import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
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
    const creds = this.loadCredentials();
    if (!creds) {
      this.logger.warn('FCM credentials not set — push notifications disabled');
      return;
    }
    try {
      const parsed = JSON.parse(creds);
      if (getApps().length === 0) {
        initializeApp({ credential: cert(parsed) });
      }
      this.ready = true;
      this.logger.log('Firebase initialized — push notifications enabled');
    } catch (e) {
      this.logger.error(`Firebase init failed: ${e}`);
    }
  }

  /**
   * Resolution order:
   *  1. FCM_SERVICE_ACCOUNT_JSON env var (raw or base64 JSON)
   *  2. firebase-service-account.json in the backend root
   */
  private loadCredentials(): string | null {
    const envJson = process.env.FCM_SERVICE_ACCOUNT_JSON;
    if (envJson) {
      return envJson.startsWith('{')
        ? envJson
        : Buffer.from(envJson, 'base64').toString('utf8');
    }
    const file = join(process.cwd(), 'firebase-service-account.json');
    if (existsSync(file)) {
      this.logger.log('Loading FCM credentials from firebase-service-account.json');
      return readFileSync(file, 'utf8');
    }
    return null;
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
        platform: platform ?? null,
        // Only relink when an owner is explicitly provided — a
        // public refresh must not strip an existing customer link
        ...(owner.customerId !== undefined && {
          customerId: owner.customerId,
        }),
        ...(owner.userId !== undefined && { userId: owner.userId }),
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

  /** Push to every customer-app install in the tenant — broadcasts
   *  reach devices whether or not a customer is logged in. */
  async sendToCustomers(tenantId: string, title: string, body: string) {
    const rows = await this.prisma.deviceToken.findMany({
      where: { tenantId, userId: null },
      select: { token: true },
    });
    await this.send(rows.map((r) => r.token), title, body, 'announcements_v2');
  }

  /** Push to one customer's devices — order updates, account status. */
  async sendToCustomer(
    tenantId: string,
    customerId: string,
    title: string,
    body: string,
  ) {
    const rows = await this.prisma.deviceToken.findMany({
      where: { tenantId, customerId },
      select: { token: true },
    });
    await this.send(rows.map((r) => r.token), title, body, 'announcements_v2');
  }

  /** Store display currency from Settings — product/order records
   *  carry their own stale 'USD' field. */
  async tenantCurrency(tenantId: string): Promise<string> {
    const s = await this.prisma.settings.findUnique({
      where: { tenantId },
      select: { currency: true },
    });
    return s?.currency ?? 'AED';
  }

  /** Push to every portal/salesman device in the tenant (new orders etc). */
  async sendToUsers(tenantId: string, title: string, body: string) {
    const rows = await this.prisma.deviceToken.findMany({
      where: { tenantId, userId: { not: null } },
      select: { token: true },
    });
    await this.send(rows.map((r) => r.token), title, body, 'orders_v2');
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
        notification: {
          channelId,
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          visibility: 'PUBLIC',
        },
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
