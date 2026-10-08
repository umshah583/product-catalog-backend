import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(private ordersRepository: OrdersRepository) {}

  private generateOrderNumber(): string {
    const ts = Date.now().toString().slice(-8);
    const rand = Math.floor(Math.random() * 900 + 100);
    return `ORD-${ts}-${rand}`;
  }

  async create(tenantId: string, dto: CreateOrderDto) {
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
