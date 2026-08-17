import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      where?: Prisma.ProductWhereInput;
      orderBy?: Prisma.ProductOrderByWithRelationInput;
    },
  ): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      ...params,
      where: {
        ...params?.where,
        tenantId,
        isActive: true,
      },
    });

    return products.map((p) => ({
      ...p,
      price: p.price.toString(),
      discountPrice: p.discountPrice?.toString(),
    }));
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<any | null> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId,
        isActive: true,
      },
    });

    if (!product) return null;

    return {
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString(),
    };
  }

  async findBySlug(
    tenantId: string,
    slug: string,
  ): Promise<any | null> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        tenantId,
        isActive: true,
      },
    });

    if (!product) return null;

    return {
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString(),
    };
  }

  async findByCategory(
    tenantId: string,
    categoryId: string,
  ): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      where: {
        categoryId,
        tenantId,
        isActive: true,
      },
    });

    return products.map((p) => ({
      ...p,
      price: p.price.toString(),
      discountPrice: p.discountPrice?.toString(),
    }));
  }

  async findFeatured(
    tenantId: string,
  ): Promise<any[]> {
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

    return products.map((p) => ({
      ...p,
      price: p.price.toString(),
      discountPrice: p.discountPrice?.toString(),
    }));
  }

  /**
   * Convert product name into a URL-friendly slug.
   *
   * Example:
   * "True wireless headphones"
   * becomes:
   * "true-wireless-headphones"
   */
  private generateSlug(value: string): string {
    return value
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate a unique slug for the tenant.
   *
   * Example:
   * true-wireless-headphones
   * true-wireless-headphones-2
   * true-wireless-headphones-3
   */
  private async generateUniqueSlug(
    tenantId: string,
    name: string,
    providedSlug?: string,
  ): Promise<string> {
    const baseSlug =
      providedSlug?.trim()
        ? this.generateSlug(providedSlug)
        : this.generateSlug(name);

    let slug = baseSlug;
    let counter = 1;

    while (
      await this.prisma.product.findFirst({
        where: {
          tenantId,
          slug,
        },
        select: {
          id: true,
        },
      })
    ) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  async create(
    tenantId: string,
    data: Prisma.ProductUncheckedCreateInput,
  ): Promise<any> {
    // Always use the server's tenant ID.
    // Do not trust tenantId coming from the frontend.
    const productData = {
      ...data,
      tenantId,
    };

    // Generate slug automatically if frontend doesn't provide one.
    const slug = await this.generateUniqueSlug(
      tenantId,
      productData.name,
      productData.slug,
    );

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug,
        tenantId,
      },
    });

    return {
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString(),
    };
  }

  async update(
    tenantId: string,
    id: string,
    data: Prisma.ProductUpdateInput,
  ): Promise<any> {
    const product = await this.prisma.product.update({
      where: {
        id,
        tenantId,
      },
      data,
    });

    return {
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString(),
    };
  }

  async softDelete(
    tenantId: string,
    id: string,
  ): Promise<Product> {
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

  async delete(
    tenantId: string,
    id: string,
  ): Promise<Product> {
    return this.prisma.product.delete({
      where: {
        id,
        tenantId,
      },
    });
  }

  async count(
    tenantId: string,
    where?: Prisma.ProductWhereInput,
  ): Promise<number> {
    return this.prisma.product.count({
      where: {
        ...where,
        tenantId,
        isActive: true,
      },
    });
  }
}