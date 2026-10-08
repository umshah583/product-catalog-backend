import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, orderNumber: string, dto: CreateOrderDto) {
    const itemCount = dto.items.reduce((sum, i) => sum + i.quantity, 0);

    return this.prisma.order.create({
      data: {
        orderNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail ?? null,
        customerAddress: dto.customerAddress ?? null,
        notes: dto.notes ?? null,
        totalAmount: dto.totalAmount,
        currency: dto.currency ?? 'USD',
        itemCount,
        tenant: { connect: { id: tenantId } },
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId ?? null,
            productName: item.productName,
            brand: item.brand ?? null,
            sku: item.sku ?? null,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll(tenantId: string, status?: string) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
  }

  async updateStatus(tenantId: string, id: string, status: any) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  }
}
