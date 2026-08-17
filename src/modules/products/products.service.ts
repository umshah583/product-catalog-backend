import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository.js';
import { Tenant } from '../../common/decorators/tenant.decorator.js';
import { PromotionalOffersService } from '../promotional-offers/promotional-offers.service.js';

@Injectable()
export class ProductsService {
  constructor(
    private productsRepository: ProductsRepository,
    private promotionalOffersService: PromotionalOffersService,
  ) {}

  async findAll(tenantId: string, params?: any) {
    return this.productsRepository.findAll(tenantId, params);
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.productsRepository.findOne(tenantId, id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findBySlug(tenantId: string, slug: string) {
    const product = await this.productsRepository.findBySlug(tenantId, slug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findByCategory(tenantId: string, categoryId: string) {
    return this.productsRepository.findByCategory(tenantId, categoryId);
  }

  async findFeatured(tenantId: string) {
    return this.productsRepository.findFeatured(tenantId);
  }

  async create(tenantId: string, data: any) {
    return this.productsRepository.create(tenantId, data);
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);
    return this.productsRepository.update(tenantId, id, data);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.productsRepository.softDelete(tenantId, id);
  }

  async count(tenantId: string, where?: any) {
    return this.productsRepository.count(tenantId, where);
  }

  private async applyPromotionalOffers(tenantId: string, products: any[]) {
    const activeOffers = await this.promotionalOffersService.findActive(tenantId);
    return products.map(product => this.applyPromotionalOfferToProduct(tenantId, product, activeOffers));
  }

  private async applyPromotionalOfferToProduct(tenantId: string, product: any, activeOffers?: any[]) {
    const offers = activeOffers || await this.promotionalOffersService.findActive(tenantId);
    const applicableOffer = this.findApplicableOffer(product, offers);
    
    if (applicableOffer) {
      const effectivePrice = this.calculateEffectivePrice(parseFloat(product.price), applicableOffer);
      return {
        ...product,
        effectivePrice: effectivePrice.toString(),
        applicableOffer: {
          id: applicableOffer.id,
          name: applicableOffer.name,
          offerType: applicableOffer.offerType,
          buyQuantity: applicableOffer.buyQuantity,
          getQuantity: applicableOffer.getQuantity,
          discountPercent: applicableOffer.discountPercent,
          discountAmount: applicableOffer.discountAmount,
        },
      };
    }
    
    return {
      ...product,
      effectivePrice: product.price,
      applicableOffer: null,
    };
  }

  private findApplicableOffer(product: any, offers: any[]) {
    const now = new Date();
    
    for (const offer of offers) {
      if (!offer.isActive) continue;
      if (new Date(offer.startDate) > now || new Date(offer.endDate) < now) continue;
      
      switch (offer.applicableTo) {
        case 'ALL_PRODUCTS':
          return offer;
        case 'SPECIFIC_CATEGORIES':
          if (offer.categoryIds && offer.categoryIds.includes(product.categoryId)) {
            return offer;
          }
          break;
        case 'SPECIFIC_PRODUCTS':
          if (offer.productIds && offer.productIds.includes(product.id)) {
            return offer;
          }
          break;
      }
    }
    
    return null;
  }

  private calculateEffectivePrice(basePrice: number, offer: any): number {
    switch (offer.offerType) {
      case 'PERCENTAGE_DISCOUNT':
        return basePrice * (1 - (offer.discountPercent / 100));
      case 'FLAT_DISCOUNT':
        return Math.max(0, basePrice - parseFloat(offer.discountAmount));
      case 'BUY_X_GET_Y_FREE':
        // For buy X get Y free, we don't change the unit price
        // The discount is applied at cart level
        return basePrice;
      default:
        return basePrice;
    }
  }
}
