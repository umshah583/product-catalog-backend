import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { ProductsRepository } from './products.repository.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PromotionalOffersModule } from '../promotional-offers/promotional-offers.module.js';

@Module({
  imports: [PromotionalOffersModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository, PrismaService],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
