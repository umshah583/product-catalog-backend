import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import {
  CustomerLoginDto,
  CustomerRegisterDto,
  UpdateCustomerStatusDto,
} from './dto/customer.dto.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { PushService } from '../../common/push/push.service.js';

@Controller('customers')
@UseInterceptors(TenantInterceptor)
export class CustomersController {
  constructor(
    private customersService: CustomersService,
    private realtime: RealtimeGateway,
    private push: PushService,
  ) {}

  // ---- Public (mobile app) ----

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Tenant() tenant: any, @Body() dto: CustomerRegisterDto) {
    return this.customersService.register(tenant.id, dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Tenant() tenant: any, @Body() dto: CustomerLoginDto) {
    return this.customersService.login(tenant.id, dto);
  }

  // ---- Customer-authenticated ----

  /** Register the device's FCM token so broadcasts can reach it. */
  @Post('device-token')
  @UseGuards(CustomerAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deviceToken(
    @Tenant() tenant: any,
    @Req() req: any,
    @Body() body: { token: string; platform?: string },
  ) {
    await this.push.registerToken(tenant.id, body.token, body.platform, {
      customerId: req.customer.sub,
    });
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  me(@Tenant() tenant: any, @Req() req: any) {
    return this.customersService.me(tenant.id, req.customer.sub);
  }

  // ---- Admin ----

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Tenant() tenant: any) {
    return this.customersService.findAll(tenant.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerStatusDto,
  ) {
    const customer = await this.customersService.updateStatus(
      tenant.id,
      id,
      dto.status,
    );
    this.realtime.emitCustomerUpdated(tenant.slug, customer);
    return customer;
  }
}
