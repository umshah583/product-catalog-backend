import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
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
    return this.ordersRepository.create(tenantId, this.generateOrderNumber(), dto);
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
