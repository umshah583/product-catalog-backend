import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsRepository } from './notifications.repository.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { RealtimeModule } from '../../realtime/realtime.module.js';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, PrismaService],
  imports: [
    JwtModule.register({}),
    RealtimeModule,
  ],
})
export class NotificationsModule {}
