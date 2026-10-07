import {
  Controller,
  Get,
  Post,
  Put,
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

@Controller('orders')
@UseInterceptors(TenantInterceptor)
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private realtime: RealtimeGateway,
  ) {}

  // Public — the mobile app submits orders here
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Tenant() tenant: any, @Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(tenant.id, dto);
    this.realtime.emitOrderCreated(tenant.slug, order);
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
    return order;
  }
}
