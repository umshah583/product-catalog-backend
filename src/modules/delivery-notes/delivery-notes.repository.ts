import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import {
  CreateDeliveryNoteDto,
  UpdateDeliveryNoteDto,
} from './dto/delivery-note.dto.js';

@Injectable()
export class DeliveryNotesRepository {
  constructor(private prisma: PrismaService) {}

  private itemData(items: CreateDeliveryNoteDto['items']) {
    return items.map((item) => ({
      productId: item.productId ?? null,
      productName: item.productName,
      brand: item.brand ?? null,
      sku: item.sku ?? null,
      barcode: item.barcode ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));
  }

  async create(tenantId: string, dnNumber: string, dto: CreateDeliveryNoteDto) {
    const itemCount = dto.items.reduce((sum, i) => sum + i.quantity, 0);

    return this.prisma.deliveryNote.create({
      data: {
        dnNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail ?? null,
        customerTrn: dto.customerTrn ?? null,
        billingAddress: dto.billingAddress ?? null,
        shippingAddress: dto.shippingAddress ?? null,
        notes: dto.notes ?? null,
        salesman: dto.salesman ?? null,
        warehouse: dto.warehouse ?? null,
        driver: dto.driver ?? null,
        vehicleNumber: dto.vehicleNumber ?? null,
        orderId: dto.orderId ?? null,
        orderNumber: dto.orderNumber ?? null,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        totalAmount: dto.totalAmount,
        currency: dto.currency ?? 'AED',
        itemCount,
        tenant: { connect: { id: tenantId } },
        items: { create: this.itemData(dto.items) },
      },
      include: { items: true },
    });
  }

  async findAll(tenantId: string, status?: string) {
    return this.prisma.deliveryNote.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.deliveryNote.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateDeliveryNoteDto) {
    const itemCount = dto.items.reduce((sum, i) => sum + i.quantity, 0);

    return this.prisma.$transaction(async (tx) => {
      await tx.deliveryNoteItem.deleteMany({ where: { deliveryNoteId: id } });
      return tx.deliveryNote.update({
        where: { id },
        data: {
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail ?? null,
          customerTrn: dto.customerTrn ?? null,
          billingAddress: dto.billingAddress ?? null,
          shippingAddress: dto.shippingAddress ?? null,
          notes: dto.notes ?? null,
          salesman: dto.salesman ?? null,
          warehouse: dto.warehouse ?? null,
          driver: dto.driver ?? null,
          vehicleNumber: dto.vehicleNumber ?? null,
          orderId: dto.orderId ?? null,
          orderNumber: dto.orderNumber ?? null,
          deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
          totalAmount: dto.totalAmount,
          currency: dto.currency ?? 'AED',
          itemCount,
          items: { create: this.itemData(dto.items) },
        },
        include: { items: true },
      });
    });
  }

  async updateStatus(tenantId: string, id: string, status: any) {
    return this.prisma.deliveryNote.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.deliveryNote.delete({ where: { id } });
  }

  async countForTenant(tenantId: string): Promise<number> {
    return this.prisma.deliveryNote.count({ where: { tenantId } });
  }
}
