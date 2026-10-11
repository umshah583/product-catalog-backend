import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository.js';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class OrdersService {
  constructor(
    private ordersRepository: OrdersRepository,
    private prisma: PrismaService,
  ) {}

  private generateOrderNumber(): string {
    const ts = Date.now().toString().slice(-8);
    const rand = Math.floor(Math.random() * 900 + 100);
    return `ORD-${ts}-${rand}`;
  }

  async create(tenantId: string, dto: CreateOrderDto) {
    // Orders placed by a registered customer require an approved account
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId },
        select: { status: true },
      });
      if (!customer) throw new NotFoundException('Customer not found');
      if (customer.status !== 'APPROVED') {
        throw new ForbiddenException('Account pending approval');
      }
    }
    dto.items = await this.validateFreeItems(tenantId, dto.items);
    return this.ordersRepository.create(tenantId, this.generateOrderNumber(), dto);
  }

  /**
   * Cap `isFree` lines at what active BOGO offers actually entitle —
   * free = floor(paidQty / buyQty) * getQty per product. Anything
   * beyond that is dropped; free lines are zero-priced server-side.
   */
  private async validateFreeItems(tenantId: string, items: OrderItemDto[]) {
    const paidQty = new Map<string, number>();
    for (const i of items) {
      if (!i.isFree && i.productId) {
        paidQty.set(i.productId, (paidQty.get(i.productId) ?? 0) + i.quantity);
      }
    }

    const offers = await this.prisma.promotionalOffer.findMany({
      where: {
        tenantId,
        isActive: true,
        offerType: 'BUY_X_GET_Y_FREE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    const freeAllowed = new Map<string, number>();
    for (const offer of offers) {
      const buy = offer.buyQuantity ?? 0;
      const get = offer.getQuantity ?? 0;
      if (!buy || !get) continue;
      let applies: string[] = [];
      if (offer.applicableTo === 'ALL_PRODUCTS') {
        applies = [...paidQty.keys()];
      } else if (offer.applicableTo === 'SPECIFIC_PRODUCTS') {
        applies = [...paidQty.keys()].filter((p) =>
          offer.productIds.includes(p),
        );
      } else if (offer.applicableTo === 'SPECIFIC_CATEGORIES') {
        const products = await this.prisma.product.findMany({
          where: {
            tenantId,
            id: { in: [...paidQty.keys()] },
            categoryId: { in: offer.categoryIds },
          },
          select: { id: true },
        });
        applies = products.map((p) => p.id);
      }
      for (const pid of applies) {
        const qty = paidQty.get(pid) ?? 0;
        const free = Math.floor(qty / buy) * get;
        freeAllowed.set(pid, Math.max(freeAllowed.get(pid) ?? 0, free));
      }
    }

    const result: OrderItemDto[] = [];
    const freeUsed = new Map<string, number>();
    for (const i of items) {
      if (i.isFree && i.productId) {
        const used = freeUsed.get(i.productId) ?? 0;
        const allowed = freeAllowed.get(i.productId) ?? 0;
        const take = Math.min(i.quantity, allowed - used);
        if (take > 0) {
          freeUsed.set(i.productId, used + take);
          result.push({
            ...i,
            quantity: take,
            unitPrice: 0,
            lineTotal: 0,
            isFree: true,
          });
        }
      } else {
        result.push(i);
      }
    }
    return result;
  }

  async findAll(tenantId: string, status?: string) {
    return this.ordersRepository.findAll(tenantId, status);
  }

  async findById(tenantId: string, id: string) {
    const order = await this.ordersRepository.findById(tenantId, id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(tenantId: string, id: string, status: any) {
    await this.findById(tenantId, id);
    return this.ordersRepository.updateStatus(tenantId, id, status);
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.ordersRepository.delete(tenantId, id);
  }
}
