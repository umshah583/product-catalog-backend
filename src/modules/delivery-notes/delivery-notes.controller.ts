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
import { DeliveryNotesService } from './delivery-notes.service.js';
import {
  CreateDeliveryNoteDto,
  UpdateDeliveryNoteDto,
  UpdateDeliveryNoteStatusDto,
} from './dto/delivery-note.dto.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';

@Controller('delivery-notes')
@UseInterceptors(TenantInterceptor)
@UseGuards(JwtAuthGuard)
export class DeliveryNotesController {
  constructor(
    private deliveryNotesService: DeliveryNotesService,
    private realtime: RealtimeGateway,
  ) {}

  @Get()
  async findAll(@Tenant() tenant: any, @Query('status') status?: string) {
    return this.deliveryNotesService.findAll(tenant.id, status);
  }

  @Get(':id')
  async findOne(@Tenant() tenant: any, @Param('id') id: string) {
    return this.deliveryNotesService.findById(tenant.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Tenant() tenant: any, @Body() dto: CreateDeliveryNoteDto) {
    const dn = await this.deliveryNotesService.create(tenant.id, dto);
    this.realtime.emitDeliveryNoteUpdated(tenant.slug, dn);
    return dn;
  }

  @Put(':id')
  async update(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryNoteDto,
  ) {
    const dn = await this.deliveryNotesService.update(tenant.id, id, dto);
    this.realtime.emitDeliveryNoteUpdated(tenant.slug, dn);
    return dn;
  }

  @Put(':id/status')
  async updateStatus(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryNoteStatusDto,
  ) {
    const dn = await this.deliveryNotesService.updateStatus(
      tenant.id,
      id,
      dto.status,
    );
    this.realtime.emitDeliveryNoteUpdated(tenant.slug, dn);
    return dn;
  }

  @Delete(':id')
  async remove(@Tenant() tenant: any, @Param('id') id: string) {
    await this.deliveryNotesService.delete(tenant.id, id);
    return { deleted: true };
  }
}
