import { Injectable } from '@nestjs/common';
import { Prisma, PromotionalOffer } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class PromotionalOffersRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any): Promise<PromotionalOffer[]> {
    const { where = {}, orderBy = {}, ...rest } = params || {};
    
    return this.prisma.promotionalOffer.findMany({
      where: {
        tenantId,
        ...where,
      },
      orderBy: orderBy || { priority: 'desc', createdAt: 'desc' },
      ...rest,
    });
  }

  async findActive(tenantId: string): Promise<PromotionalOffer[]> {
    const now = new Date();
    
    return this.prisma.promotionalOffer.findMany({
      where: {
        tenantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string): Promise<PromotionalOffer | null> {
    return this.prisma.promotionalOffer.findFirst({
      where: { id, tenantId },
    });
  }

  async create(tenantId: string, data: Prisma.PromotionalOfferUncheckedCreateInput): Promise<PromotionalOffer> {
    return this.prisma.promotionalOffer.create({
      data: { ...data, tenantId },
    });
  }

  async update(tenantId: string, id: string, data: Prisma.PromotionalOfferUpdateInput): Promise<PromotionalOffer> {
    return this.prisma.promotionalOffer.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string): Promise<PromotionalOffer> {
    return this.prisma.promotionalOffer.delete({
      where: { id },
    });
  }

  async count(tenantId: string, where?: any): Promise<number> {
    return this.prisma.promotionalOffer.count({
      where: { tenantId, ...where },
    });
  }
}
