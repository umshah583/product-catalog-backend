import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DeliveryNotesController } from './delivery-notes.controller.js';
import { DeliveryNotesService } from './delivery-notes.service.js';
import { DeliveryNotesRepository } from './delivery-notes.repository.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [DeliveryNotesController],
  providers: [
    DeliveryNotesService,
    DeliveryNotesRepository,
    PrismaService,
    JwtAuthGuard,
  ],
  exports: [DeliveryNotesService],
})
export class DeliveryNotesModule {}
