import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      ...params,
      where: {
        ...params?.where,
        tenantId,
        isActive: true,
      },
    });
    
    // Convert Decimal to string for JSON serialization
    return products.map(p => ({
      ...p,
      price: p.price.toString(),
      discountPrice: p.discountPrice?.toString(),
    }));
  }

  async findOne(tenantId: string, id: string): Promise<any | null> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId,
        isActive: true,
      },
    });
    
    if (!product) return null;
    
    // Convert Decimal to string for JSON serialization
    return {
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString(),
    };
  }

  async findBySlug(tenantId: string, slug: string): Promise<any | null> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        tenantId,
        isActive: true,
      },
    });
    
    if (!product) return null;
    
    // Convert Decimal to string for JSON serialization
    return {
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString(),
    };
  }

  async findByCategory(tenantId: string, categoryId: string): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      where: {
        categoryId,
        tenantId,
        isActive: true,
      },
    });
    
    // Convert Decimal to string for JSON serialization
    return products.map(p => ({
      ...p,
      price: p.price.toString(),
      discountPrice: p.discountPrice?.toString(),
    }));
  }

  async findFeatured(tenantId: string): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        featured: true,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Convert Decimal to string for JSON serialization
    return products.map(p => ({
      ...p,
      price: p.price.toString(),
      discountPrice: p.discountPrice?.toString(),
    }));
  }

  async create(tenantId: string, data: Prisma.ProductUncheckedCreateInput): Promise<any> {
    const product = await this.prisma.product.create({
      data: {
        ...data,
        tenantId,
      },
    });
    
    // Convert Decimal to string for JSON serialization
    return {
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString(),
    };
  }

  async update(tenantId: string, id: string, data: Prisma.ProductUpdateInput): Promise<any> {
    const product = await this.prisma.product.update({
      where: {
        id,
        tenantId,
      },
      data,
    });
    
    // Convert Decimal to string for JSON serialization
    return {
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString(),
    };
  }

  async softDelete(tenantId: string, id: string): Promise<Product> {
    return this.prisma.product.update({
      where: {
        id,
        tenantId,
      },
      data: {
        isActive: false,
      },
    });
  }

  async delete(tenantId: string, id: string): Promise<Product> {
    return this.prisma.product.delete({
      where: {
        id,
        tenantId,
      },
    });
  }

  async count(tenantId: string, where?: Prisma.ProductWhereInput): Promise<number> {
    return this.prisma.product.count({
      where: {
        ...where,
        tenantId,
        isActive: true,
      },
    });
  }
}
