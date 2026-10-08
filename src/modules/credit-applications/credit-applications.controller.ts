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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreditApplicationsService } from './credit-applications.service.js';
import {
  CreateCreditApplicationDto,
  UpdateCreditApplicationDto,
  UpdateCreditAppStatusDto,
  UpsertDocumentDto,
} from './dto/credit-application.dto.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';

@Controller('credit-applications')
@UseInterceptors(TenantInterceptor)
@UseGuards(JwtAuthGuard)
export class CreditApplicationsController {
  constructor(
    private service: CreditApplicationsService,
    private realtime: RealtimeGateway,
  ) {}

  @Get()
  async findAll(@Tenant() tenant: any, @Query('status') status?: string) {
    return this.service.findAll(tenant.id, status);
  }

  @Get(':id')
  async findOne(@Tenant() tenant: any, @Param('id') id: string) {
    return this.service.findById(tenant.id, id);
  }

  /** Generated PDF download/preview — the official document with data overlaid. */
  @Get(':id/pdf')
  async downloadPdf(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Res() res: Response,
    @Query('disposition') disposition?: string,
  ) {
    const { bytes, filename } = await this.service.generatePdf(tenant.id, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition === 'inline' ? 'inline' : 'attachment'}; filename="${filename}"`,
      'Content-Length': bytes.length,
    });
    res.send(Buffer.from(bytes));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Tenant() tenant: any, @Body() dto: CreateCreditApplicationDto) {
    const app = await this.service.create(tenant.id, dto);
    this.realtime.emitCreditApplicationUpdated(tenant.slug, app);
    return app;
  }

  @Put(':id')
  async update(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Body() dto: UpdateCreditApplicationDto,
  ) {
    const app = await this.service.update(tenant.id, id, dto);
    this.realtime.emitCreditApplicationUpdated(tenant.slug, app);
    return app;
  }

  @Put(':id/status')
  async updateStatus(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Body() dto: UpdateCreditAppStatusDto,
  ) {
    const app = await this.service.updateStatus(
      tenant.id,
      id,
      dto.status,
      null,
      dto.internalNotes,
    );
    this.realtime.emitCreditApplicationUpdated(tenant.slug, app);
    return app;
  }

  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  async addDocument(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Body() dto: UpsertDocumentDto,
  ) {
    return this.service.addDocument(tenant.id, id, dto);
  }

  @Put(':id/documents/:docId')
  async updateDocument(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: { received: boolean; remarks?: string },
  ) {
    return this.service.markDocumentReceived(
      tenant.id,
      id,
      docId,
      dto.received,
      dto.remarks,
    );
  }

  @Delete(':id/documents/:docId')
  async removeDocument(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Param('docId') docId: string,
  ) {
    await this.service.removeDocument(tenant.id, id, docId);
    return { deleted: true };
  }

  @Delete(':id')
  async remove(@Tenant() tenant: any, @Param('id') id: string) {
    await this.service.delete(tenant.id, id);
    return { deleted: true };
  }
}
