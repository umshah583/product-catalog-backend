import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { BroadcastNotificationDto } from './dto/notification.dto.js';

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  create(tenantId: string, dto: BroadcastNotificationDto) {
    return this.prisma.notification.create({
      data: { tenantId, title: dto.title, body: dto.body },
    });
  }

  findRecent(tenantId: string, take: number) {
    return this.prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
