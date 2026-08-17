import { Injectable, NotFoundException } from '@nestjs/common';
import { PromotionalOffersRepository } from './promotional-offers.repository.js';

@Injectable()
export class PromotionalOffersService {
  constructor(private promotionalOffersRepository: PromotionalOffersRepository) {}

  async findAll(tenantId: string, params?: any) {
    return this.promotionalOffersRepository.findAll(tenantId, params);
  }

  async findActive(tenantId: string) {
    return this.promotionalOffersRepository.findActive(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const offer = await this.promotionalOffersRepository.findOne(tenantId, id);
    if (!offer) {
      throw new NotFoundException('Promotional offer not found');
    }
    return offer;
  }

  async create(tenantId: string, data: any) {
    return this.promotionalOffersRepository.create(tenantId, data);
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);
    return this.promotionalOffersRepository.update(tenantId, id, data);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.promotionalOffersRepository.remove(tenantId, id);
  }

  async count(tenantId: string, where?: any) {
    return this.promotionalOffersRepository.count(tenantId, where);
  }
}
