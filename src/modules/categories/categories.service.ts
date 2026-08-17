import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository.js';

@Injectable()
export class CategoriesService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async findAll(tenantId: string, params?: any) {
    return this.categoriesRepository.findAll(tenantId, params);
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.categoriesRepository.findOne(tenantId, id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async findBySlug(tenantId: string, slug: string) {
    const category = await this.categoriesRepository.findBySlug(tenantId, slug);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(tenantId: string, data: any) {
    return this.categoriesRepository.create(tenantId, data);
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);
    return this.categoriesRepository.update(tenantId, id, data);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.categoriesRepository.softDelete(tenantId, id);
  }

  async count(tenantId: string, where?: any) {
    return this.categoriesRepository.count(tenantId, where);
  }
}
