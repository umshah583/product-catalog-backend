import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { CustomersRepository } from './customers.repository.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository, PrismaService],
  imports: [
    JwtModule.register({}),
    RealtimeModule,
    OrdersModule,
  ],
  exports: [CustomersService],
})
export class CustomersModule {}
