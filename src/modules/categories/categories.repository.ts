import { Injectable } from '@nestjs/common';
import { Prisma, Category } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: {
    skip?: number;
    take?: number;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
  }): Promise<Category[]> {
    return this.prisma.category.findMany({
      ...params,
      where: {
        ...params?.where,
        tenantId,
        isActive: true,
      },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        id,
        tenantId,
        isActive: true,
      },
    });
  }

  async findBySlug(tenantId: string, slug: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        slug,
        tenantId,
        isActive: true,
      },
    });
  }

  async create(tenantId: string, data: Prisma.CategoryUncheckedCreateInput): Promise<Category> {
    return this.prisma.category.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async update(tenantId: string, id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({
      where: {
        id,
        tenantId,
      },
      data,
    });
  }

  async softDelete(tenantId: string, id: string): Promise<Category> {
    return this.prisma.category.update({
      where: {
        id,
        tenantId,
      },
      data: {
        isActive: false,
      },
    });
  }

  async delete(tenantId: string, id: string): Promise<Category> {
    return this.prisma.category.delete({
      where: {
        id,
        tenantId,
      },
    });
  }

  async count(tenantId: string, where?: Prisma.CategoryWhereInput): Promise<number> {
    return this.prisma.category.count({
      where: {
        ...where,
        tenantId,
        isActive: true,
      },
    });
  }
}
