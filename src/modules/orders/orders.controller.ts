import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { PushService } from '../../common/push/push.service.js';

@Controller('orders')
@UseInterceptors(TenantInterceptor)
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private realtime: RealtimeGateway,
    private push: PushService,
  ) {}

  // Public — the mobile app submits orders here
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Tenant() tenant: any, @Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(tenant.id, dto);
    this.realtime.emitOrderCreated(tenant.slug, order);
    // Push to salesmen even when the app is killed
    const currency = await this.push.tenantCurrency(tenant.id);
    await this.push.sendToUsers(
      tenant.id,
      `New order ${order.orderNumber}`,
      `${order.customerName} — ${currency} ${Number(order.totalAmount).toFixed(2)}`,
    );
    return order;
  }

  // Admin endpoints — require JWT
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Tenant() tenant: any, @Query('status') status?: string) {
    return this.ordersService.findAll(tenant.id, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Tenant() tenant: any, @Param('id') id: string) {
    return this.ordersService.findById(tenant.id, id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(tenant.id, id, dto.status);
    this.realtime.emitOrderUpdated(tenant.slug, order);

    // Notify the customer about their order's progress
    if (order.customerId) {
      const statusText = {
        CONFIRMED: 'has been confirmed',
        OUT_FOR_DELIVERY: 'is out for delivery',
        COMPLETED: 'has been delivered',
        CANCELLED: 'was cancelled',
      } as Record<string, string>;
      if (statusText[dto.status]) {
        await this.push.sendToCustomer(
          tenant.id,
          order.customerId,
          `Order ${order.orderNumber}`,
          `Your order ${statusText[dto.status]}`,
        );
      }
    }
    return order;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Tenant() tenant: any, @Param('id') id: string) {
    const order = await this.ordersService.findById(tenant.id, id);
    await this.ordersService.delete(tenant.id, id);
    this.realtime.emitOrderDeleted(tenant.slug, id);
    return order;
  }
}
