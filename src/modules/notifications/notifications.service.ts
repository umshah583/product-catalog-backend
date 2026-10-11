import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository.js';
import { BroadcastNotificationDto } from './dto/notification.dto.js';

@Injectable()
export class NotificationsService {
  constructor(private notificationsRepository: NotificationsRepository) {}

  create(tenantId: string, dto: BroadcastNotificationDto) {
    return this.notificationsRepository.create(tenantId, dto);
  }

  findRecent(tenantId: string, take = 50) {
    return this.notificationsRepository.findRecent(tenantId, take);
  }
}
