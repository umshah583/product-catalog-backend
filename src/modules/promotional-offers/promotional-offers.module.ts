import { Module } from '@nestjs/common';
import { PromotionalOffersController } from './promotional-offers.controller.js';
import { PromotionalOffersService } from './promotional-offers.service.js';
import { PromotionalOffersRepository } from './promotional-offers.repository.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Module({
  controllers: [PromotionalOffersController],
  providers: [PromotionalOffersService, PromotionalOffersRepository, PrismaService],
  exports: [PromotionalOffersService],
})
export class PromotionalOffersModule {}
