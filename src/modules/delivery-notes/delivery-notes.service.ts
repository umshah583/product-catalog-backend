import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryNotesRepository } from './delivery-notes.repository.js';
import {
  CreateDeliveryNoteDto,
  UpdateDeliveryNoteDto,
} from './dto/delivery-note.dto.js';

@Injectable()
export class DeliveryNotesService {
  constructor(private deliveryNotesRepository: DeliveryNotesRepository) {}

  private async generateDnNumber(tenantId: string): Promise<string> {
    const count = await this.deliveryNotesRepository.countForTenant(tenantId);
    return `DN-${String(count + 1).padStart(6, '0')}`;
  }

  async create(tenantId: string, dto: CreateDeliveryNoteDto) {
    const dnNumber = await this.generateDnNumber(tenantId);
    return this.deliveryNotesRepository.create(tenantId, dnNumber, dto);
  }

  async findAll(tenantId: string, status?: string) {
    return this.deliveryNotesRepository.findAll(tenantId, status);
  }

  async findById(tenantId: string, id: string) {
    const dn = await this.deliveryNotesRepository.findById(tenantId, id);
    if (!dn) throw new NotFoundException('Delivery note not found');
    return dn;
  }

  async update(tenantId: string, id: string, dto: UpdateDeliveryNoteDto) {
    await this.findById(tenantId, id);
    return this.deliveryNotesRepository.update(tenantId, id, dto);
  }

  async updateStatus(tenantId: string, id: string, status: any) {
    await this.findById(tenantId, id);
    return this.deliveryNotesRepository.updateStatus(tenantId, id, status);
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.deliveryNotesRepository.delete(tenantId, id);
  }
}
