import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { OrdersRepository } from './orders.repository.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, PrismaService, JwtAuthGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
